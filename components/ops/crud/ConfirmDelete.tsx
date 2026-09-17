export default function ConfirmDelete({
  message,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  message: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="ops-card"
      style={{ marginTop: 14, borderColor: "rgba(239,68,68,.35)" }}
    >
      <p className="empty-state">{message}</p>
      <div
        style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}
      >
        <button
          type="button"
          className="btn-ghost"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? "A eliminar…" : "Eliminar"}
        </button>
      </div>
    </div>
  );
}
