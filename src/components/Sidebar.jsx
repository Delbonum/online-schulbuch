import { NavLink } from "react-router-dom";
import { CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { LEVELS, pagePath } from "../levels";

export default function Sidebar({ open, onNavigate }) {
  const { isUnlocked, hasPassed, role } = useAuth();

  return (
    <aside
      className={`fixed md:sticky top-10 left-0 z-30 h-[calc(100vh-2.5rem)] w-64 shrink-0 overflow-y-auto
        bg-slate-950/95 md:bg-white/10 text-white shadow-lg transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full md:hidden"}`}
      aria-label="Level-Navigation"
    >
      <nav className="p-4 space-y-5">
        {LEVELS.map((level) => {
          const unlocked = isUnlocked(level.number);
          const passed = role !== "teacher" && hasPassed(level.number);
          return (
            <section key={level.number}>
              <h2 className="flex items-center gap-2 font-semibold heading-style">
                Level {level.number}
                <span className="font-extralight text-textlight text-sm">· {level.title}</span>
                {!unlocked && <Lock size={14} className="text-white/60" aria-label="gesperrt" />}
                {passed && <CheckCircle2 size={14} className="text-green-400" aria-label="bestanden" />}
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {level.pages
                  .filter((page) => !page.hidden)
                  .map((page) => (
                    <li key={page.slug}>
                      {unlocked ? (
                        <NavLink
                          to={pagePath(level.number, page.slug)}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            `block rounded px-2 py-0.5 text-style ${
                              isActive ? "bg-white/20 text-white" : "text-blue-300 hover:text-white underline"
                            }`
                          }
                        >
                          {page.title}
                        </NavLink>
                      ) : (
                        <span className="block px-2 py-0.5 text-white/40 text-style">{page.title}</span>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
