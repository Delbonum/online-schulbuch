/** Einfach- (Radio) oder Mehrfachauswahl (Checkboxen). */
export default function ChoiceQuestion({ question, value, onChange, disabled }) {
  const multiple = question.type === "multiple";
  const selected = multiple ? (value ?? []) : value;

  const toggle = (index) => {
    if (!multiple) {
      onChange(index);
      return;
    }
    onChange(selected.includes(index) ? selected.filter((i) => i !== index) : [...selected, index]);
  };

  return (
    <div className="space-y-1">
      {multiple && <p className="text-sm text-white/60 mb-1">Mehrere Antworten können richtig sein.</p>}
      {question.options.map((option, index) => (
        <label key={index} className="flex items-start gap-2 cursor-pointer">
          <input
            type={multiple ? "checkbox" : "radio"}
            name={`question-${question.id}`}
            checked={multiple ? selected.includes(index) : selected === index}
            onChange={() => toggle(index)}
            disabled={disabled}
            className="mt-1.5"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}
