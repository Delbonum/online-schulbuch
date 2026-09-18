import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AccountPage from "./AccountPage";
import { api } from "../lib/api";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));
jest.mock("../lib/api", () => ({ api: { changePassword: jest.fn(), deleteAccount: jest.fn() } }));

const mockRefresh = jest.fn();
jest.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, username: "lehrerin", role: "teacher" }, refresh: mockRefresh }),
}));

const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AccountPage />
    </MemoryRouter>,
  );

beforeEach(() => jest.clearAllMocks());

test("Konto löschen erfordert Bestätigung mit Passwort", async () => {
  const user = userEvent.setup();
  api.deleteAccount.mockResolvedValue(null);

  renderPage();
  expect(screen.getByText(/allen Klassen, Zugängen deiner Schüler\/-innen/)).toBeInTheDocument();
  expect(screen.queryByLabelText("Zur Bestätigung dein Passwort")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Konto löschen …/ }));
  await user.type(screen.getByLabelText("Zur Bestätigung dein Passwort"), "geheim123");
  await user.click(screen.getByRole("button", { name: "Endgültig löschen" }));

  expect(api.deleteAccount).toHaveBeenCalledWith("geheim123");
  expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
});

test("Fehler beim Löschen bleibt auf der Seite", async () => {
  const user = userEvent.setup();
  api.deleteAccount.mockRejectedValue(new Error("Das Passwort ist nicht korrekt."));

  renderPage();
  await user.click(screen.getByRole("button", { name: /Konto löschen …/ }));
  await user.type(screen.getByLabelText("Zur Bestätigung dein Passwort"), "falsch");
  await user.click(screen.getByRole("button", { name: "Endgültig löschen" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("nicht korrekt");
  expect(mockNavigate).not.toHaveBeenCalled();
});
