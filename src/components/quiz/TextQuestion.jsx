export default function TextQuestion({ question, value = "", onChange, disabled }) {
  return (
    <input
      type="text"
      aria-label={`Antwort zu Aufgabe ${question.id}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      autoComplete="off"
      spellCheck={false}
      className="input-style w-full uppercase"
    />
  );
}
