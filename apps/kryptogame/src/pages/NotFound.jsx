import { Link } from "react-router-dom";
import { firstPagePath } from "../levels";

export default function NotFound() {
  return (
    <div className="text-style">
      <h1 className="text-3xl font-bold mb-4 heading-style">🕳️ Zeitloch</h1>
      <p className="mb-6">Diese Seite existiert in keiner Epoche.</p>
      <Link to={firstPagePath} className="btn">
        Zurück zum Start
      </Link>
    </div>
  );
}
