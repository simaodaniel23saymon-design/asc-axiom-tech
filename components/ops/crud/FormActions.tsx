export default function FormActions({
  submitLabel,
  isSubmitting,
  onCancel,
}: {
  submitLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {submitLabel}
      </button>
      <button
        type="button"
        className="btn-ghost"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancelar
      </button>
    </div>
  );
}
