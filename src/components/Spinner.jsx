export default function Spinner({ label = "Wird geladen …" }) {
  return (
    <div role="status" className="flex items-center gap-3 text-style py-8">
      <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}
