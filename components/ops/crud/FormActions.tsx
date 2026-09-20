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
    <div className="ops-form-actions">
      <button
        type="submit"
        className="btn-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "A guardar…" : submitLabel}
      </button>

      <button
        type="button"
        className="btn-secondary"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancelar
      </button>
    </div>
  );
}
