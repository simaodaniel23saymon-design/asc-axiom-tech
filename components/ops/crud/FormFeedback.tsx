export default function FormFeedback({
  message,
  tone = "error",
}: {
  message: string | null;
  tone?: "error" | "success";
}) {
  if (!message) return null;
  return (
    <p
      className={tone === "error" ? "auth-error" : "empty-state"}
      style={tone === "success" ? { color: "var(--green)" } : undefined}
    >
      {message}
    </p>
  );
}
