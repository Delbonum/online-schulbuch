import { useState } from "react";
import Modal from "../components/Modal";

export default function ConfirmDialog({ title, confirmLabel, onConfirm, onClose, children }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-dialog">
            Abbrechen
          </button>
          <button type="button" onClick={handleConfirm} className="btn-dialog-danger" disabled={busy}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{children}</p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </Modal>
  );
}
