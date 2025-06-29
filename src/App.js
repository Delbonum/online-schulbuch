import React, { useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LoginPage from "./auth/LoginPage";
import TopBar from "./auth/TopBar";
import Einfuehrung from "./pages/lvl1/Einfuehrung";
import ChiffrierenLvl1 from './pages/lvl1/Chiffrieren';
import DechiffrierenLvl1 from './pages/lvl1/Dechiffrieren';
import FachkonzepteLvl1 from "./pages/lvl1/Fachkonzepte";
import QuizLvl1 from "./pages/lvl1/Quiz";
import SuccessLvl1 from "./pages/lvl1/Success";
import Level2Intro from "./pages/lvl2/Level2Intro";
import ChiffrierenLvl2 from "./pages/lvl2/Chiffrieren";
import DechiffrierenLvl2 from "./pages/lvl2/Dechiffrieren";
import KryptoanalyseLvl2 from "./pages/lvl2/Kryptoanalyse";
import FachkonzepteLvl2 from "./pages/lvl2/Fachkonzepte";
import QuizLvl2 from "./pages/lvl2/Quiz";
import SuccessLvl2 from "./pages/lvl2/Success";
import Level3Intro from "./pages/lvl3/Level3Intro";
import Historie from "./pages/lvl3/Historie";
import Vigenere from "./pages/lvl3/Vigenere";
import KryptoanalyseLvl3 from "./pages/lvl3/KryptoanalyseVigenere";
import Kasiski from "./pages/lvl3/Kasiski";
import OneTimePad from "./pages/lvl3/OneTimePad";
import FachkonzepteLvl3 from "./pages/lvl3/Fachkonzepte";
import QuizLvl3 from "./pages/lvl3/Quiz";
import SuccessLvl3 from "./pages/lvl3/Success";
import Level4Intro from "./pages/lvl4/Level4Intro";
import WeiterButton from "./pages/components/WeiterButton";
import ZugriffsError from "./pages/components/ZugriffsError";
import Dashboard from "./auth/Dashboard";

function App() {
  const [menuOpen, setMenuOpen] = useState(true);

  return (
  <>
    <TopBar />
    <div className="pt-6 min-h-screen flex bg-stars bg-repeat text-textlight font-oxanium">
      <aside className={`transition-all duration-300 ${menuOpen ? 'w-64' : 'w-12'} bg-white/10 text-white shadow-lg overflow-hidden`}>
        <div className="p-4">
          <button
            className="text-gray-300 hover:text-white mb-4"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          {menuOpen && (
            <div>
              <h2 className="text-lg heading-style mb-4">Navigation</h2>
              <label className="block text-white font-semibold">Level 1</label>
              <ul className="space-y-2 text-sm">
                <li><Link to="/level1/start" className="text-blue-300 hover:text-white underline text-style">Start</Link></li>
                <li><Link to="/level1/dechiffrieren" className="text-blue-300 hover:text-white underline text-style">Erster Nachrichtenfund</Link></li>
                <li><Link to="/level1/chiffrieren" className="text-blue-300 hover:text-white underline text-style">Antworte verschlüsselt</Link></li>
                <li><Link to="/level1/fachkonzepte" className="text-blue-300 hover:text-white underline text-style">Fachkonzepte</Link></li>
                <li><Link to="/level1/pruefung" className="text-blue-300 hover:text-white underline text-style">Zwischenprüfung</Link></li>
              </ul>
              <br />
              <label className="block text-white font-semibold">Level 2</label>
              <ul className="space-y-2 text-sm">
                <li><Link to="/level2/start" className="text-blue-300 hover:text-white underline text-style">Zweite Etappe</Link></li>
                <li><Link to="/level2/chiffrieren" className="text-blue-300 hover:text-white underline text-style">Al-Kindis Abhandlung</Link></li>
                <li><Link to="/level2/dechiffrieren" className="text-blue-300 hover:text-white underline text-style">Botschaften lesen</Link></li>
                <li><Link to="/level2/kryptoanalyse" className="text-blue-300 hover:text-white underline text-style">Erste Kryptoanalysen</Link></li>
                <li><Link to="/level2/fachkonzepte" className="text-blue-300 hover:text-white underline text-style">Fachkonzepte</Link></li>
                <li><Link to="/level2/pruefung" className="text-blue-300 hover:text-white underline text-style">Zwischenprüfung</Link></li>
              </ul>
              <br />
              <label className="block text-white font-semibold">Level 3</label>
              <ul className="space-y-2 text-sm">
                <li><Link to="/level3/start" className="text-blue-300 hover:text-white underline text-style">Caesar goes polyalphabetic</Link></li>
                <li><Link to="/level3/historie" className="text-blue-300 hover:text-white underline text-style">Im 16. Jahrhundert</Link></li>
                <li><Link to="/level3/vigenere" className="text-blue-300 hover:text-white underline text-style">Das Vigenère-Verfahren</Link></li>
                <li><Link to="/level3/kryptoanalyse" className="text-blue-300 hover:text-white underline text-style">Sicherheitsbedenken</Link></li>
                <li><Link to="/level3/kasiski" className="text-blue-300 hover:text-white underline text-style">Der Kasiski-Test</Link></li>
                <li><Link to="/level3/onetimepad" className="text-blue-300 hover:text-white underline text-style">One-Time-Pad</Link></li>
                <li><Link to="/level3/fachkonzepte" className="text-blue-300 hover:text-white underline text-style">Fachkonzepte</Link></li>
                <li><Link to="/level3/pruefung" className="text-blue-300 hover:text-white underline text-style">Zwischenprüfung</Link></li>
              </ul>
              <br />
              <label className="block text-white font-semibold">Level 4</label>
              <ul className="space-y-2 text-sm">
                <li><Link to="/level4/start" className="text-blue-300 hover:text-white underline text-style">Baustelle</Link></li>
              </ul>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/level1/start" element={<Einfuehrung />} />
          <Route path="/level1/dechiffrieren" element={<DechiffrierenLvl1 />} />
          <Route path="/level1/chiffrieren" element={<ChiffrierenLvl1 />} />
          <Route path="/level1/fachkonzepte" element={<FachkonzepteLvl1 />} />
          <Route path="/level1/pruefung" element={<QuizLvl1 />} />
          <Route path="/level1/abschluss" element={<SuccessLvl1 />} />
          <Route path="/level2/start" element={<Level2Intro />} />
          <Route path="/level2/chiffrieren" element={<ChiffrierenLvl2 />} />
          <Route path="/level2/dechiffrieren" element={<DechiffrierenLvl2 />} />
          <Route path="/level2/kryptoanalyse" element={<KryptoanalyseLvl2 />} />
          <Route path="/level2/fachkonzepte" element={<FachkonzepteLvl2 />} />
          <Route path="/level2/pruefung" element={<QuizLvl2 />} />
          <Route path="/level2/abschluss" element={<SuccessLvl2 />} />
          <Route path="/level3/start" element={<Level3Intro />} />
          <Route path="/level3/historie" element={<Historie />} />
          <Route path="/level3/vigenere" element={<Vigenere />} />
          <Route path="/level3/kryptoanalyse" element={<KryptoanalyseLvl3 />} />
          <Route path="/level3/kasiski" element={<Kasiski />} />
          <Route path="/level3/onetimepad" element={<OneTimePad />} />
          <Route path="/level3/fachkonzepte" element={<FachkonzepteLvl3 />} />
          <Route path="/level3/pruefung" element={<QuizLvl3 />} />
          <Route path="/level3/abschluss" element={<SuccessLvl3 />} />
          <Route path="/level4/start" element={<Level4Intro />} />
          <Route path="/zugriffsfehler" element={<ZugriffsError />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  </>
  );
}

export default App;
