import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import LevelPage from "./components/LevelPage";
import Spinner from "./components/Spinner";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";
import NotFound from "./pages/NotFound";
import { LEVELS, firstPagePath, pagePath } from "./levels";

// Das Dashboard (mit Diagramm-Bibliothek) wird nur für Lehrkräfte nachgeladen
const Dashboard = lazy(() => import("./dashboard/Dashboard"));

const isSmallScreen = () => typeof window !== "undefined" && window.innerWidth < 768;

function RequireRole({ roles, children }) {
  const { loading, role } = useAuth();
  if (loading) return <Spinner />;
  return roles.includes(role) ? children : <Navigate to="/login" replace />;
}

function Home() {
  const { loading, role } = useAuth();
  if (loading) return <Spinner />;
  if (role === "teacher") return <Navigate to="/dashboard" replace />;
  if (role === "student") return <Navigate to={firstPagePath} replace />;
  return <LoginPage />;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(() => !isSmallScreen());
  const location = useLocation();

  // Auf kleinen Bildschirmen die Navigation nach einem Seitenwechsel schließen
  useEffect(() => {
    if (isSmallScreen()) setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <TopBar onToggleMenu={() => setMenuOpen((open) => !open)} />
      <div className="pt-10 min-h-screen flex bg-stars bg-repeat text-textlight font-oxanium">
        {/* Auf kleinen Bildschirmen liegt die Navigation über der Seite */}
        {menuOpen && (
          <button
            type="button"
            className="fixed inset-0 top-10 z-20 bg-black/60 md:hidden"
            aria-label="Navigation schließen"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <Sidebar open={menuOpen} onNavigate={() => isSmallScreen() && setMenuOpen(false)} />
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/konto"
              element={
                <RequireRole roles={["teacher", "student"]}>
                  <AccountPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireRole roles={["teacher"]}>
                  <Suspense fallback={<Spinner />}>
                    <Dashboard />
                  </Suspense>
                </RequireRole>
              }
            />
            {LEVELS.flatMap((level) =>
              level.pages.map((page) => (
                <Route
                  key={pagePath(level.number, page.slug)}
                  path={pagePath(level.number, page.slug)}
                  element={<LevelPage level={level} page={page} />}
                />
              )),
            )}
            {LEVELS.map((level) => (
              <Route
                key={level.number}
                path={`/level${level.number}`}
                element={<Navigate to={pagePath(level.number, level.pages[0].slug)} replace />}
              />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
