import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { nextPagePath, quizPath } from "../levels";
import { requiredLevel } from "../lib/progress";
import WeiterButton from "./WeiterButton";
import Spinner from "./Spinner";

/**
 * Rahmen für jede Levelseite: prüft die Freischaltung, zeigt die Seite und
 * darunter den "Weiter"-Button zur nächsten Seite laut Level-Konfiguration.
 */
export default function LevelPage({ level, page }) {
  const { loading, isUnlocked, optionalLevels } = useAuth();

  useEffect(() => {
    document.title = `${page.title} – Level ${level.number} – Krypto-Zeitreise`;
    window.scrollTo(0, 0);
  }, [level.number, page.title]);

  if (loading) {
    return <Spinner />;
  }

  if (!isUnlocked(level.number)) {
    const required = requiredLevel(level.number, optionalLevels);
    return (
      <div className="page">
        <h1 className="text-3xl font-bold text-red-500 heading-style">🚨 Zeitreise-Fehler</h1>
        <p className="mb-6">
          Offenbar gibt es ein Problem mit deiner Zeitmaschine. <br />
          Löse erst die Zwischenprüfung von Level {required}, um diese Seite zu öffnen.
        </p>
        {quizPath(required) && (
          <Link to={quizPath(required)} className="btn">
            Zur Zwischenprüfung von Level {required}
          </Link>
        )}
      </div>
    );
  }

  const { Component } = page;
  const next = nextPagePath(level.number, page.slug);

  return (
    <article className="page">
      <Component level={level.number} nextPath={next} />
      {/* Bei Prüfungen geht es erst nach dem Bestehen weiter */}
      {!page.quiz && next && <WeiterButton to={next} />}
    </article>
  );
}
