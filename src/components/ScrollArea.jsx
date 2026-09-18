import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Bereich, der bei zu wenig Platz seitlich gescrollt werden kann.
 * Ist der Inhalt breiter als der Bildschirm, erscheint darunter ein dezenter Hinweis.
 */
export default function ScrollArea({ children, className = "", hint = "seitlich scrollbar" }) {
  const ref = useRef(null);
  const [scrollable, setScrollable] = useState(false);

  const check = useCallback(() => {
    const element = ref.current;
    if (element) setScrollable(element.scrollWidth > element.clientWidth + 1);
  }, []);

  useEffect(() => {
    check();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }
    const observer = new ResizeObserver(check);
    if (ref.current) {
      observer.observe(ref.current);
      // Auch auf Änderungen des Inhalts reagieren (z. B. längerer Geheimtext)
      if (ref.current.firstElementChild) observer.observe(ref.current.firstElementChild);
    }
    return () => observer.disconnect();
  }, [check]);

  return (
    <div className={className}>
      <div ref={ref} className="overflow-x-auto">
        {children}
      </div>
      {scrollable && (
        <p className="mt-1 text-xs text-white/50" aria-hidden="true">
          ↔ {hint}
        </p>
      )}
    </div>
  );
}
