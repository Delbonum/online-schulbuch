import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import Modal from "../components/Modal";
import { api } from "../lib/api";

/** Klassen anlegen, umbenennen und löschen. */
export default function ClassesDialog({ classes, levels = [], onClose, onChange }) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null); // { id, name }
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const create = (event) => {
    event.preventDefault();
    run(async () => {
      const { class: created } = await api.createClass(newName.trim());
      onChange([...classes, created].sort((a, b) => a.name.localeCompare(b.name, "de")));
      setNewName("");
    });
  };

  const rename = () =>
    run(async () => {
      const { class: updated } = await api.updateClass(editing.id, { name: editing.name.trim() });
      onChange(
        classes.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name, "de")),
      );
      setEditing(null);
    });

  /** Ein Level für diese Klasse als freiwillig markieren oder die Markierung entfernen. */
  const toggleOptional = (klass, level) =>
    run(async () => {
      const optionalLevels = klass.optionalLevels.includes(level)
        ? klass.optionalLevels.filter((l) => l !== level)
        : [...klass.optionalLevels, level].sort((x, y) => x - y);
      const { class: updated } = await api.updateClass(klass.id, { optionalLevels });
      onChange(classes.map((c) => (c.id === updated.id ? updated : c)));
    });

  const remove = (klass) =>
    run(async () => {
      await api.deleteClass(klass.id);
      onChange(classes.filter((c) => c.id !== klass.id));
      setConfirmDelete(null);
    });

  return (
    <Modal
      title="Klassen verwalten"
      onClose={onClose}
      footer={
        <button type="button" className="btn-dialog" onClick={onClose}>
          Schließen
        </button>
      }
    >
      <form onSubmit={create} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="dialog-input"
          placeholder="Name der neuen Klasse, z. B. 9b"
          maxLength={64}
          aria-label="Name der neuen Klasse"
          required
        />
        <button type="submit" className="btn-dialog-primary whitespace-nowrap" disabled={busy}>
          Anlegen
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-700 mb-3">
          {error}
        </p>
      )}

      {classes.length === 0 ? (
        <p className="text-sm text-gray-600">
          Noch keine Klassen. Klassen sind optional – sie helfen, Schüler/-innen zu ordnen und Statistiken pro Klasse
          anzusehen.
        </p>
      ) : (
        <ul className="divide-y">
          {classes.map((klass) => (
            <li key={klass.id} className="py-2 flex flex-wrap items-center gap-2">
              {editing?.id === klass.id ? (
                <>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="dialog-input"
                    maxLength={64}
                    aria-label={`Neuer Name für ${klass.name}`}
                  />
                  <button type="button" className="btn-dialog-primary" onClick={rename} disabled={busy}>
                    <Check size={16} aria-hidden="true" /> Speichern
                  </button>
                  <button type="button" className="btn-dialog" onClick={() => setEditing(null)}>
                    <X size={16} aria-hidden="true" /> Abbrechen
                  </button>
                </>
              ) : confirmDelete === klass.id ? (
                <>
                  <span className="flex-1 text-sm">
                    <strong>{klass.name}</strong> löschen? Die Schüler/-innen bleiben erhalten und haben danach keine
                    Klasse.
                  </span>
                  <button type="button" className="btn-dialog-danger" onClick={() => remove(klass)} disabled={busy}>
                    Löschen
                  </button>
                  <button type="button" className="btn-dialog" onClick={() => setConfirmDelete(null)}>
                    Abbrechen
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">
                    {klass.name}{" "}
                    <span className="text-gray-500 text-sm">
                      ({klass.studentCount} {klass.studentCount === 1 ? "Person" : "Personen"})
                    </span>
                  </span>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => setEditing({ id: klass.id, name: klass.name })}
                    aria-label={`${klass.name} umbenennen`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => setConfirmDelete(klass.id)}
                    aria-label={`${klass.name} löschen`}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}

              {levels.length > 0 && editing?.id !== klass.id && confirmDelete !== klass.id && (
                <fieldset className="basis-full mt-1">
                  <legend className="text-xs text-gray-600 mb-1">
                    Freiwillige Level (Prüfung nicht nötig, um weiterzukommen)
                  </legend>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {levels.map((level) => (
                      <label key={level} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={klass.optionalLevels.includes(level)}
                          onChange={() => toggleOptional(klass, level)}
                          disabled={busy}
                          aria-label={`Level ${level} in ${klass.name} freiwillig`}
                        />
                        Level {level}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
