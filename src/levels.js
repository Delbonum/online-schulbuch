// Zentrale Beschreibung aller Level und Seiten.
// Navigation, Routen, Freischaltung und "Weiter"-Buttons werden hieraus erzeugt.
// Ein neues Level braucht nur einen weiteren Eintrag (und eine Prüfung im Backend unter quizzes/).

import Einfuehrung from "./pages/lvl1/Einfuehrung";
import DechiffrierenLvl1 from "./pages/lvl1/Dechiffrieren";
import ChiffrierenLvl1 from "./pages/lvl1/Chiffrieren";
import FachkonzepteLvl1 from "./pages/lvl1/Fachkonzepte";
import QuizLvl1 from "./pages/lvl1/Quiz";
import Level2Intro from "./pages/lvl2/Level2Intro";
import ChiffrierenLvl2 from "./pages/lvl2/Chiffrieren";
import DechiffrierenLvl2 from "./pages/lvl2/Dechiffrieren";
import KryptoanalyseLvl2 from "./pages/lvl2/Kryptoanalyse";
import FachkonzepteLvl2 from "./pages/lvl2/Fachkonzepte";
import QuizLvl2 from "./pages/lvl2/Quiz";
import Level3Intro from "./pages/lvl3/Level3Intro";
import Historie from "./pages/lvl3/Historie";
import Vigenere from "./pages/lvl3/Vigenere";
import KryptoanalyseLvl3 from "./pages/lvl3/KryptoanalyseVigenere";
import Kasiski from "./pages/lvl3/Kasiski";
import OneTimePad from "./pages/lvl3/OneTimePad";
import FachkonzepteLvl3 from "./pages/lvl3/Fachkonzepte";
import QuizLvl3 from "./pages/lvl3/Quiz";
import Level4Intro from "./pages/lvl4/Level4Intro";
import Farbmischung from "./pages/lvl4/Farbmischung";
import Modulo from "./pages/lvl4/Modulo";
import DiffieHellman from "./pages/lvl4/DiffieHellman";
import FachkonzepteLvl4 from "./pages/lvl4/Fachkonzepte";
import QuizLvl4 from "./pages/lvl4/Quiz";
import Level5Intro from "./pages/lvl5/Level5Intro";
import LevelComplete from "./components/LevelComplete";

/**
 * @typedef {{ slug: string, title: string, Component: Function, quiz?: boolean, hidden?: boolean }} PageConfig
 * @typedef {{ number: number, title: string, pages: PageConfig[] }} LevelConfig
 */

/** @type {LevelConfig[]} */
export const LEVELS = [
  {
    number: 1,
    title: "Caesar",
    pages: [
      { slug: "start", title: "Start", Component: Einfuehrung },
      { slug: "dechiffrieren", title: "Erster Nachrichtenfund", Component: DechiffrierenLvl1 },
      { slug: "chiffrieren", title: "Antworte verschlüsselt", Component: ChiffrierenLvl1 },
      { slug: "fachkonzepte", title: "Fachkonzepte", Component: FachkonzepteLvl1 },
      { slug: "pruefung", title: "Zwischenprüfung", Component: QuizLvl1, quiz: true },
      { slug: "abschluss", title: "Abschluss", Component: LevelComplete, hidden: true },
    ],
  },
  {
    number: 2,
    title: "Al-Kindi",
    pages: [
      { slug: "start", title: "Zweite Etappe", Component: Level2Intro },
      { slug: "chiffrieren", title: "Al-Kindis Abhandlung", Component: ChiffrierenLvl2 },
      { slug: "dechiffrieren", title: "Botschaften lesen", Component: DechiffrierenLvl2 },
      { slug: "kryptoanalyse", title: "Erste Kryptoanalysen", Component: KryptoanalyseLvl2 },
      { slug: "fachkonzepte", title: "Fachkonzepte", Component: FachkonzepteLvl2 },
      { slug: "pruefung", title: "Zwischenprüfung", Component: QuizLvl2, quiz: true },
      { slug: "abschluss", title: "Abschluss", Component: LevelComplete, hidden: true },
    ],
  },
  {
    number: 3,
    title: "Vigenère",
    pages: [
      { slug: "start", title: "Caesar goes polyalphabetic", Component: Level3Intro },
      { slug: "historie", title: "Im 16. Jahrhundert", Component: Historie },
      { slug: "vigenere", title: "Das Vigenère-Verfahren", Component: Vigenere },
      { slug: "kryptoanalyse", title: "Sicherheitsbedenken", Component: KryptoanalyseLvl3 },
      { slug: "kasiski", title: "Der Kasiski-Test", Component: Kasiski },
      { slug: "onetimepad", title: "One-Time-Pad", Component: OneTimePad },
      { slug: "fachkonzepte", title: "Fachkonzepte", Component: FachkonzepteLvl3 },
      { slug: "pruefung", title: "Zwischenprüfung", Component: QuizLvl3, quiz: true },
      { slug: "abschluss", title: "Abschluss", Component: LevelComplete, hidden: true },
    ],
  },
  {
    number: 4,
    title: "Schlüsselaustausch",
    pages: [
      { slug: "start", title: "Das Schlüsselproblem", Component: Level4Intro },
      { slug: "farbmischung", title: "Geheimnisse mischen", Component: Farbmischung },
      { slug: "modulo", title: "Rechnen im Kreis", Component: Modulo },
      { slug: "diffie-hellman", title: "Diffie-Hellman", Component: DiffieHellman },
      { slug: "fachkonzepte", title: "Fachkonzepte", Component: FachkonzepteLvl4 },
      { slug: "pruefung", title: "Zwischenprüfung", Component: QuizLvl4, quiz: true },
      { slug: "abschluss", title: "Abschluss", Component: LevelComplete, hidden: true },
    ],
  },
  {
    number: 5,
    title: "Ausblick",
    pages: [{ slug: "start", title: "Baustelle", Component: Level5Intro }],
  },
];

export const pagePath = (level, slug) => `/level${level}/${slug}`;

export const firstPagePath = pagePath(LEVELS[0].number, LEVELS[0].pages[0].slug);

export const getLevel = (number) => LEVELS.find((level) => level.number === number);

/** Pfad der Seite, die in der Reihenfolge nach der angegebenen folgt (auch levelübergreifend). */
export function nextPagePath(levelNumber, slug) {
  const levelIndex = LEVELS.findIndex((level) => level.number === levelNumber);
  const pages = LEVELS[levelIndex]?.pages ?? [];
  const pageIndex = pages.findIndex((page) => page.slug === slug);
  if (pageIndex !== -1 && pageIndex + 1 < pages.length) {
    return pagePath(levelNumber, pages[pageIndex + 1].slug);
  }
  const nextLevel = LEVELS[levelIndex + 1];
  return nextLevel ? pagePath(nextLevel.number, nextLevel.pages[0].slug) : null;
}

/** Pfad der Prüfung eines Levels. */
export function quizPath(levelNumber) {
  const quizPage = getLevel(levelNumber)?.pages.find((page) => page.quiz);
  return quizPage ? pagePath(levelNumber, quizPage.slug) : null;
}
