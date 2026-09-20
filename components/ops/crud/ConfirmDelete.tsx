"use client";

import { useEffect, useRef } from "react";

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
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const first = cancelRef.current;
      const last = confirmRef.current;

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className="ops-confirm-delete"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="ops-confirm-delete-title"
      aria-describedby="ops-confirm-delete-message"
    >
      <div className="ops-confirm-delete-content">
        <div className="ops-confirm-delete-icon" aria-hidden="true">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>

        <h3 id="ops-confirm-delete-title">
          Confirmar eliminação
        </h3>

        <p id="ops-confirm-delete-message">{message}</p>

        <div className="ops-form-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </button>

          <button
            ref={confirmRef}
            type="button"
            className="btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <i
              className="fa-solid fa-trash"
              aria-hidden="true"
            />
            <span>
              {isDeleting ? "A eliminar…" : "Eliminar"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
