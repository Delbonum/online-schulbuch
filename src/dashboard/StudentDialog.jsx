import { useEffect, useRef, useState } from "react";
import Modal from "../components/Modal";
import { api } from "../lib/api";

/** Schüler/-in anlegen (ohne `student`) oder bearbeiten. */
export default function StudentDialog({ student, levels, focusPassword = false, onClose, onSaved }) {
  const isEdit = Boolean(student);
  const [username, setUsername] = useState(student?.username ?? "");
  const [password, setPassword] = useState("");
  const [passedLevels, setPassedLevels] = useState(student?.passedLevels ?? []);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (focusPassword) passwordRef.current?.focus();
  }, [focusPassword]);

  const toggleLevel = (level) =>
    setPassedLevels((current) =>
      current.includes(level) ? current.filter((l) => l !== level) : [...current, level].sort((a, b) => a - b),
    );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let result;
      if (isEdit) {
        const changes = { passedLevels };
        if (username !== student.username) changes.username = username;
        if (password) changes.password = password;
        result = await api.updateStudent(student.id, changes);
      } else {
        result = await api.createStudent(username, password);
      }
      onSaved(result.student);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const formId = isEdit ? "student-edit-form" : "student-create-form";

  return (
    <Modal
      title={isEdit ? `${student.username} bearbeiten` : "Neue/r Schüler/-in"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-dialog">
            Abbrechen
          </button>
          <button type="submit" form={formId} className="btn-dialog-primary" disabled={saving}>
            {isEdit ? "Speichern" : "Anlegen"}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor={`${formId}-username`} className="block text-sm font-medium mb-1">
            Benutzername
          </label>
          <input
            id={`${formId}-username`}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="dialog-input"
            autoComplete="off"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            3–32 Zeichen: Buchstaben, Ziffern, Punkt, Unterstrich, Bindestrich.
          </p>
        </div>

        <div>
          <label htmlFor={`${formId}-password`} className="block text-sm font-medium mb-1">
            {isEdit ? "Neues Passwort (leer lassen = unverändert)" : "Passwort"}
          </label>
          <input
            ref={passwordRef}
            id={`${formId}-password`}
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="dialog-input font-mono"
            autoComplete="new-password"
            minLength={6}
            required={!isEdit}
          />
          <p className="text-xs text-gray-500 mt-1">
            Mindestens 6 Zeichen. Das Passwort wird nur verschlüsselt gespeichert.
          </p>
        </div>

        {isEdit && (
          <fieldset>
            <legend className="text-sm font-medium mb-1">Bestandene Level (manuell freischalten/sperren)</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {levels.map((level) => (
                <label key={level} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={passedLevels.includes(level)} onChange={() => toggleLevel(level)} />
                  Level {level}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
