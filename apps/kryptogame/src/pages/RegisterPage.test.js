import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import { api } from "../lib/api";

jest.mock("../lib/api", () => ({ api: { register: jest.fn() } }));

const fill = async (user) => {
  await user.type(screen.getByLabelText("Vor- und Nachname"), "Erika Musterfrau");
  await user.type(screen.getByLabelText("Schule"), "Gymnasium Musterstadt");
  await user.type(screen.getByLabelText("Ort"), "Musterstadt");
  await user.type(screen.getByLabelText("E-Mail-Adresse"), "erika@example.org");
  await user.type(screen.getByLabelText("Gewünschter Benutzername"), "erika.m");
  await user.type(screen.getByLabelText(/Passwort/), "sicher123");
};

test("Registrierung wird abgeschickt und bestätigt", async () => {
  const user = userEvent.setup();
  api.register.mockResolvedValue({ status: "pending" });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RegisterPage />
    </MemoryRouter>,
  );
  await fill(user);
  await user.click(screen.getByRole("button", { name: "Registrierung abschicken" }));

  expect(api.register).toHaveBeenCalledWith({
    fullName: "Erika Musterfrau",
    school: "Gymnasium Musterstadt",
    city: "Musterstadt",
    email: "erika@example.org",
    username: "erika.m",
    password: "sicher123",
  });
  expect(await screen.findByText(/Registrierung übermittelt/)).toBeInTheDocument();
  expect(screen.getByText("erika@example.org")).toBeInTheDocument();
});

test("Fehler vom Server werden angezeigt", async () => {
  const user = userEvent.setup();
  api.register.mockRejectedValue(new Error("Dieser Benutzername ist bereits vergeben."));

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RegisterPage />
    </MemoryRouter>,
  );
  await fill(user);
  await user.click(screen.getByRole("button", { name: "Registrierung abschicken" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("bereits vergeben");
});
