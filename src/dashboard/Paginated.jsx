import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Zeigt eine lange Liste seitenweise an.
 * `children` bekommt den Ausschnitt der aktuellen Seite.
 */
export default function Paginated({ items, perPage = 6, label = "Einträge", children }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));

  // Nach dem Löschen oder Freigeben kann die aktuelle Seite wegfallen
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  const start = page * perPage;
  const visible = items.slice(start, start + perPage);

  return (
    <>
      {children(visible)}

      {items.length > perPage && (
        <div className="flex items-center justify-between gap-2 mt-2 text-sm">
          <button
            type="button"
            className="btn-dialog"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            aria-label={`Vorherige Seite (${label})`}
          >
            <ChevronLeft size={16} aria-hidden="true" /> Zurück
          </button>
          <span className="text-gray-600">
            {start + 1}–{Math.min(start + perPage, items.length)} von {items.length} {label}
          </span>
          <button
            type="button"
            className="btn-dialog"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pageCount - 1}
            aria-label={`Nächste Seite (${label})`}
          >
            Weiter <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
