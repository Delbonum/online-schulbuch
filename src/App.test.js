import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { api } from "./lib/api";

jest.mock("./lib/api", () => {
  const actual = jest.requireActual("./lib/api");
  return {
    ...actual,
    api: {
      me: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      quiz: jest.fn(),
      submitQuiz: jest.fn(),
    },
  };
});

const QUIZ = {
  level: 1,
  title: "Zwischenprüfung Level 1",
  questions: [
    { id: 1, type: "text", prompt: "Geheimtext von SCHLACHT?" },
    { id: 2, type: "single", prompt: "Was macht Caesar?", options: ["Vertauschen", "Verschieben"] },
    { id: 3, type: "multiple", prompt: "Was stimmt?", options: ["A", "B", "C"] },
    { id: 4, type: "order", prompt: "Ordne!", items: ["zwei", "eins"] },
  ],
};

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  api.me.mockResolvedValue({ user: null });
  api.quiz.mockResolvedValue({ quiz: QUIZ });
});

test("Gäste können Level 2 erst nach bestandenem Level 1 öffnen", async () => {
  renderApp("/level2/start");
  expect(await screen.findByText(/Zeitreise-Fehler/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Zwischenprüfung von Level 1/ })).toHaveAttribute("href", "/level1/pruefung");
});

test("Gastfortschritt aus dem Browser schaltet das nächste Level frei", async () => {
  localStorage.setItem("kryptogame.guestPassedLevels", "[1]");
  renderApp("/level2/start");
  expect(await screen.findByRole("heading", { name: /Die Reise geht weiter/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Weiter" })).toHaveAttribute("href", "/level2/chiffrieren");
});

test("Lehrkräfte haben Zugriff auf alle Level", async () => {
  api.me.mockResolvedValue({ user: { id: 1, username: "lehrer", role: "teacher", passedLevels: [] } });
  renderApp("/level3/start");
  expect(await screen.findByRole("heading", { name: /Grübeleien/ })).toBeInTheDocument();
});

test("Prüfung: Antworten senden, Rückmeldung anzeigen, beim Bestehen freischalten", async () => {
  const user = userEvent.setup();
  api.submitQuiz
    .mockResolvedValueOnce({
      score: 50,
      passed: false,
      results: [
        { task: 1, correct: true },
        { task: 2, correct: false },
        { task: 3, correct: true },
        { task: 4, correct: false },
      ],
    })
    .mockResolvedValueOnce({
      score: 100,
      passed: true,
      results: [1, 2, 3, 4].map((task) => ({ task, correct: true })),
    });

  renderApp("/level1/pruefung");

  await user.type(await screen.findByLabelText("Antwort zu Aufgabe 1"), "vfkodfkw");
  await user.click(screen.getByLabelText("Verschieben"));
  await user.click(screen.getByLabelText("A"));
  await user.click(screen.getByLabelText("C"));
  await user.click(screen.getByRole("button", { name: "„eins“ nach oben verschieben" }));
  await user.click(screen.getByRole("button", { name: "Prüfung abschließen" }));

  expect(api.submitQuiz).toHaveBeenLastCalledWith(1, { 1: "vfkodfkw", 2: 1, 3: [0, 2], 4: ["eins", "zwei"] });
  expect(await screen.findByText(/2 von 4 Aufgaben richtig \(50 %\)/)).toBeInTheDocument();
  expect(screen.getAllByText("✗ Falsch.")).toHaveLength(2);

  await user.click(screen.getByRole("button", { name: "Prüfung abschließen" }));
  expect(await screen.findByText(/Alle Antworten korrekt/)).toBeInTheDocument();
  await waitFor(() => expect(JSON.parse(localStorage.getItem("kryptogame.guestPassedLevels"))).toEqual([1]));

  // Level 2 ist in der Navigation jetzt anklickbar
  const nav = screen.getByRole("complementary", { name: "Level-Navigation" });
  expect(within(nav).getByRole("link", { name: "Zweite Etappe" })).toBeInTheDocument();
});

test("Fehler beim Laden der Prüfung werden angezeigt", async () => {
  const { ApiError } = jest.requireActual("./lib/api");
  api.quiz.mockRejectedValue(new ApiError(0, "Der Server ist nicht erreichbar."));
  renderApp("/level1/pruefung");
  expect(await screen.findByRole("alert")).toHaveTextContent("Der Server ist nicht erreichbar.");
  expect(screen.getByRole("button", { name: "Erneut versuchen" })).toBeInTheDocument();
});

test("Login zeigt eine Fehlermeldung bei falschen Zugangsdaten", async () => {
  const user = userEvent.setup();
  const { ApiError } = jest.requireActual("./lib/api");
  api.login.mockRejectedValueOnce(new ApiError(401, "Benutzername oder Passwort sind nicht korrekt."));

  renderApp("/login");
  await user.type(await screen.findByLabelText("Benutzername"), "max");
  await user.type(screen.getByLabelText("Passwort"), "falsch");
  await user.click(screen.getByRole("button", { name: "Anmelden" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("nicht korrekt");
});

test("Unbekannte Seiten zeigen eine Fehlerseite", async () => {
  renderApp("/gibt-es-nicht");
  expect(await screen.findByText(/Zeitloch/)).toBeInTheDocument();
});
