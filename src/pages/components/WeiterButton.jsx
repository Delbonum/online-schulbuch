import React from "react";
import { useNavigate } from "react-router-dom";

export default function WeiterButton({ to }) {
  const navigate = useNavigate();

  return (
  <div className="flex justify-end">
    <button
      onClick={() => navigate(to)}
      className="mt-6 px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition"
    >
      Weiter
    </button>
  </div>
);

}
