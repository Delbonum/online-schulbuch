import { useEffect, useId, useRef } from "react";

/**
 * Heller Dialog über der Seite. Schließt mit Escape oder Klick auf den Hintergrund.
 */
export default function Modal({ title, onClose, children, footer, size = "md" }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const focusable = dialogRef.current?.querySelector("input, select, textarea, button");
    (focusable ?? dialogRef.current)?.focus();

    const handleKey = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus?.();
    };
  }, []);

  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-white text-black rounded-lg shadow-xl w-full ${widths[size]} max-h-[90vh] flex flex-col`}
      >
        <h2 id={titleId} className="text-lg font-bold px-6 pt-5 pb-3">
          {title}
        </h2>
        <div className="px-6 pb-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t flex justify-end gap-2 flex-wrap">{footer}</div>}
      </div>
    </div>
  );
}
