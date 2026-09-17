import { useState } from "react";
import Modal from "../components/Modal";
import { api } from "../lib/api";

// Ohne leicht verwechselbare Zeichen (0/O, 1/l/I)
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 8) {
  const random = new Uint32Array(length);
  window.crypto.getRandomValues(random);
  return Array.from(random, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join("");
}

/** "Max Mustermann" → "max.mustermann" (Umlaute umschreiben, unerlaubte Zeichen entfernen) */
export function toUsername(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // Akzente entfernen
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 32);
}

function printList(prefix, rows) {
  const win = window.open("", "_blank");
  if (!win) return;
  const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const cards = rows
    .map(
      (row) =>
        `<div class="card"><h2>Krypto-Zeitreise</h2><p>${escape(window.location.origin + prefix)}</p>` +
        `<p>Benutzername: <b>${escape(row.username)}</b></p><p>Passwort: <b>${escape(row.password)}</b></p></div>`,
    )
    .join("");
  win.document.write(
    `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Zugangsdaten</title><style>` +
      `body{font-family:sans-serif;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:16px}` +
      `.card{border:1px dashed #666;padding:12px;break-inside:avoid}h2{margin:0 0 8px;font-size:16px}` +
      `p{margin:4px 0;font-size:14px}b{font-family:monospace;font-size:15px}</style></head><body>${cards}</body></html>`,
  );
  win.document.close();
  win.focus();
  win.print();
}

/** Mehrere Schüler/-innen aus einer Namensliste anlegen. */
export default function BulkCreateDialog({ classes = [], defaultClassId = null, onClose, onCreated }) {
  const [names, setNames] = useState("");
  const [classId, setClassId] = useState(defaultClassId);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  const candidates = names
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ name: line, username: toUsername(line) }));

  const create = async () => {
    setRunning(true);
    const outcome = [];
    for (const candidate of candidates) {
      const password = generatePassword();
      try {
        const { student } = await api.createStudent(candidate.username, password, classId);
        outcome.push({ ...candidate, password, ok: true });
        onCreated(student);
      } catch (err) {
        outcome.push({ ...candidate, ok: false, error: err.message });
      }
      setResults([...outcome]);
    }
    setRunning(false);
  };

  const created = results?.filter((r) => r.ok) ?? [];

  const footer = results ? (
    <>
      {created.length > 0 && (
        <button
          type="button"
          className="btn-dialog-primary mr-auto"
          onClick={() => printList(process.env.PUBLIC_URL, created)}
        >
          Zugangskarten drucken
        </button>
      )}
      <button type="button" className="btn-dialog" onClick={onClose} disabled={running}>
        Schließen
      </button>
    </>
  ) : (
    <>
      <button type="button" className="btn-dialog" onClick={onClose}>
        Abbrechen
      </button>
      <button type="button" className="btn-dialog-primary" onClick={create} disabled={candidates.length === 0}>
        {candidates.length} Zugänge anlegen
      </button>
    </>
  );

  return (
    <Modal title="Klasse anlegen" onClose={running ? undefined : onClose} footer={footer} size="lg">
      {!results ? (
        <div className="space-y-3">
          <label htmlFor="bulk-names" className="block text-sm font-medium">
            Ein Name pro Zeile (z. B. aus einer Klassenliste kopiert). Daraus werden Benutzernamen wie{" "}
            <code>max.mustermann</code> gebildet, die Passwörter werden zufällig erzeugt.
          </label>
          {classes.length > 0 && (
            <div>
              <label htmlFor="bulk-class" className="block text-sm font-medium mb-1">
                Klasse
              </label>
              <select
                id="bulk-class"
                value={classId ?? ""}
                onChange={(e) => setClassId(e.target.value === "" ? null : Number(e.target.value))}
                className="dialog-input"
              >
                <option value="">Ohne Klasse</option>
                {classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <textarea
            id="bulk-names"
            rows={8}
            className="dialog-input font-mono"
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder={"Max Mustermann\nErika Musterfrau"}
          />
          {candidates.length > 0 && (
            <p className="text-xs text-gray-600">
              Vorschau:{" "}
              {candidates
                .slice(0, 4)
                .map((c) => c.username || "(ungültig)")
                .join(", ")}
              {candidates.length > 4 && ", …"}
            </p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm mb-3">
            {running ? "Zugänge werden angelegt …" : `${created.length} von ${results.length} Zugängen angelegt.`}{" "}
            <strong>Notiere oder drucke die Passwörter jetzt</strong> – sie werden nur verschlüsselt gespeichert und
            können später nicht mehr angezeigt werden.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-1">Name</th>
                <th className="py-1">Benutzername</th>
                <th className="py-1">Passwort</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1">{row.name}</td>
                  <td className="py-1 font-mono">{row.username}</td>
                  <td className="py-1 font-mono">
                    {row.ok ? row.password : <span className="text-red-700">{row.error}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
