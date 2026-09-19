import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

/**
 * Elemente in die richtige Reihenfolge bringen – per Drag & Drop oder mit den Pfeiltasten-Buttons
 * (funktioniert damit auch auf Touchgeräten und mit der Tastatur).
 */
export default function OrderQuestion({ question, value, onChange, disabled }) {
  const items = value ?? question.items;
  const [dragIndex, setDragIndex] = useState(null);

  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <ol className="bg-white/10 p-2 rounded space-y-2">
      {items.map((item, index) => (
        <li
          key={item}
          draggable={!disabled}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null) move(dragIndex, index);
            setDragIndex(null);
          }}
          onDragEnd={() => setDragIndex(null)}
          className={`flex items-center gap-2 bg-white/20 p-2 rounded ${disabled ? "" : "cursor-move"} ${
            dragIndex === index ? "opacity-50" : ""
          }`}
        >
          <GripVertical size={16} className="text-white/50 shrink-0" aria-hidden="true" />
          <span className="flex-1">{item}</span>
          <button
            type="button"
            onClick={() => move(index, index - 1)}
            disabled={disabled || index === 0}
            className="p-1 rounded hover:bg-white/20 disabled:opacity-30"
            aria-label={`„${item}“ nach oben verschieben`}
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => move(index, index + 1)}
            disabled={disabled || index === items.length - 1}
            className="p-1 rounded hover:bg-white/20 disabled:opacity-30"
            aria-label={`„${item}“ nach unten verschieben`}
          >
            <ChevronDown size={16} />
          </button>
        </li>
      ))}
    </ol>
  );
}
