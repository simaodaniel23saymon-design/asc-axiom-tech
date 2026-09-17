import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(databaseUrl);

function toBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    key,
    256,
  );

  return ["pbkdf2_sha256", 210000, toBase64Url(salt), toBase64Url(new Uint8Array(bits))].join("$");
}

const goals = [
  ["Make NZoCHAIN investor-ready", "Board and investor materials live", 78],
  ["Launch enterprise pilot layer", "3 pilot companies engaged", 64],
  ["Operationalize internal command center", "Weekly execution cadence active", 82],
  ["Build strategic narrative and content system", "Three messaging pillars validated", 57],
];

const projects = [
  ["NZoCHAIN Platform", "Product & Engineering", "Investor-readiness sprint", "in_progress"],
  ["Investor Briefing Pack", "Strategy", "Board pack finalization", "review"],
  ["Security Intelligence Layer", "Research", "Threat model sign-off", "planning"],
  ["Operations Dashboard", "Ops", "Weekly KPI review", "live"],
];

const roadmap = [
  ["Q3", "Narrative and product validation", "in_progress"],
  ["Q4", "Pilot expansion and security proof points", "planned"],
  ["Q1", "Commercial readiness and partner pipeline", "planned"],
];

const teamMembers = [
  ["Afonso Costa", "CEO", "Company direction and NZoCHAIN narrative"],
  ["Nuno Silva", "Product Lead", "Product strategy and roadmap"],
  ["Anita Martins", "Engineering", "Platform delivery and architecture"],
  ["Marta Dias", "Operations", "Execution, reporting, investor comms"],
];

const tasks = [
  ["Finalize NZoCHAIN product narrative", "Product", "high", "Today"],
  ["Validate onboarding flow for enterprise pilots", "Engineering", "high", "Tomorrow"],
  ["Prepare investor memo for Q3 review", "Strategy", "medium", "Friday"],
  ["Align security intelligence briefings", "Operations", "low", "Next week"],
];

const activities = [
  ["09:20", "Investor memo draft was updated with new NZoCHAIN framing."],
  ["11:45", "Engineering closed the onboarding issue backlog for pilot users."],
  ["14:10", "Procedures were reviewed for the weekly strategic operating review."],
  ["Today", "Board-ready narrative pack moved into final approval."],
];

let inserted = 0;
let skipped = 0;

async function insertIfMissing(findExisting, insertRecord) {
  const existing = await findExisting();
  if (existing.length > 0) {
    skipped += 1;
    return;
  }

  await insertRecord();
  inserted += 1;
}

if (process.env.ADMIN_INITIAL_PASSWORD) {
  const email = process.env.ADMIN_INITIAL_EMAIL || "admin@ascaxiomtech.com";
  const passwordHash = await hashPassword(process.env.ADMIN_INITIAL_PASSWORD);

  await insertIfMissing(
    () => sql`select id from users where email = ${email} limit 1`,
    () => sql`insert into users (name, email, password_hash, role, status) values ('Afonso Costa', ${email}, ${passwordHash}, 'admin', 'active')`,
  );
}

for (const [title, target, progress] of goals) {
  await insertIfMissing(
    () => sql`select id from goals where title = ${title} limit 1`,
    () => sql`insert into goals (title, target, progress, status) values (${title}, ${target}, ${progress}, 'in_progress')`,
  );
}

for (const [name, ownerLabel, milestone, status] of projects) {
  await insertIfMissing(
    () => sql`select id from projects where name = ${name} limit 1`,
    () => sql`insert into projects (name, owner_label, description, status) values (${name}, ${ownerLabel}, ${milestone}, ${status})`,
  );
}

for (const [phase, title, status] of roadmap) {
  await insertIfMissing(
    () => sql`select id from roadmap where title = ${title} limit 1`,
    () => sql`insert into roadmap (phase, title, status) values (${phase}, ${title}, ${status})`,
  );
}

for (const [name, role, focus] of teamMembers) {
  await insertIfMissing(
    () => sql`select id from team_members where name = ${name} limit 1`,
    () => sql`insert into team_members (name, role, focus) values (${name}, ${role}, ${focus})`,
  );
}

for (const [title, ownerLabel, priority, dueLabel] of tasks) {
  await insertIfMissing(
    () => sql`select id from tasks where title = ${title} limit 1`,
    () => sql`insert into tasks (title, owner_label, priority, description) values (${title}, ${ownerLabel}, ${priority}, ${dueLabel})`,
  );
}

for (const [time, text] of activities) {
  const activityText = `${time} - ${text}`;

  await insertIfMissing(
    () => sql`select id from activities where text = ${activityText} limit 1`,
    () => sql`insert into activities (type, text) values ('seed_imported', ${activityText})`,
  );
}

console.log(JSON.stringify({ inserted, skipped }));