import { Link } from "react-router-dom";

export default function WeiterButton({ to, children = "Weiter" }) {
  return (
    <div className="flex justify-end mt-6">
      <Link to={to} className="btn">
        {children}
      </Link>
    </div>
  );
}
