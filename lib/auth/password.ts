const PASSWORD_ALGORITHM = "pbkdf2_sha256";
const PASSWORD_ITERATIONS = 210000;

function toBase64Url(value: Uint8Array) {
  let binary = "";

  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    256,
  );

  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);

  return [PASSWORD_ALGORITHM, PASSWORD_ITERATIONS, toBase64Url(salt), toBase64Url(hash)].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationValue, encodedSalt, encodedHash] = storedHash.split("$");
  const iterations = Number(iterationValue);

  if (
    algorithm !== PASSWORD_ALGORITHM ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100000 ||
    !encodedSalt ||
    !encodedHash
  ) {
    return false;
  }

  const candidate = await derivePasswordHash(password, fromBase64Url(encodedSalt), iterations);
  const expected = fromBase64Url(encodedHash);

  if (candidate.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate[index] ^ expected[index];
  }

  return difference === 0;
}