export default function FormFeedback({
  message,
  tone = "error",
}: {
  message: string | null;
  tone?: "error" | "success";
}) {
  if (!message) return null;

  return (
    <div
      className={`ops-feedback ${tone}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <i
        className={
          tone === "error"
            ? "fa-solid fa-circle-exclamation"
            : "fa-solid fa-circle-check"
        }
        aria-hidden="true"
      />

      <span>{message}</span>
    </div>
  );
}
