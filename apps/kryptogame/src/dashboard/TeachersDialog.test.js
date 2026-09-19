import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeachersDialog from "./TeachersDialog";
import { api } from "../lib/api";

jest.mock("../lib/api", () => ({
  api: {
    teachers: jest.fn(),
    registrations: jest.fn(),
    decideRegistration: jest.fn(),
    createTeacher: jest.fn(),
    updateTeacher: jest.fn(),
    deleteTeacher: jest.fn(),
  },
}));

const TEACHERS = [
  { id: 1, username: "Nix", isMaster: true, studentCount: 3 },
  { id: 2, username: "kollege", isMaster: false, studentCount: 0 },
];

const REGISTRATIONS = [
  {
    id: 10,
    username: "bewerberin",
    fullName: "Erika Musterfrau",
    school: "Gymnasium Musterstadt",
    city: "Musterstadt",
    email: "erika@example.org",
    status: "pending",
    createdAt: "2026-09-18T10:00:00Z",
  },
  {
    id: 9,
    username: "alt",
    fullName: "Alt",
    school: "S",
    city: "O",
    email: "a@b.de",
    status: "rejected",
    createdAt: "2026-09-01T10:00:00Z",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  api.teachers.mockResolvedValue({ teachers: TEACHERS });
  api.registrations.mockResolvedValue({ registrations: REGISTRATIONS });
});

test("zeigt offene Registrierungen und gibt sie frei", async () => {
  const user = userEvent.setup();
  api.decideRegistration.mockResolvedValue({ status: "approved" });

  render(<TeachersDialog onClose={jest.fn()} currentUserId={1} />);
  expect(await screen.findByText(/Offene Registrierungen \(1\)/)).toBeInTheDocument();
  expect(screen.getByText(/Gymnasium Musterstadt, Musterstadt/)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Freigeben/ }));
  expect(api.decideRegistration).toHaveBeenCalledWith(10, "approve");
  expect(api.teachers).toHaveBeenCalledTimes(2); // nach der Entscheidung neu geladen
});

test("das eigene Master-Konto lässt sich nicht ändern oder löschen", async () => {
  render(<TeachersDialog onClose={jest.fn()} currentUserId={1} />);
  expect(await screen.findByLabelText("Nix als Master-Konto")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Nix löschen" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "kollege löschen" })).toBeEnabled();
});

test("neue Lehrkraft anlegen", async () => {
  const user = userEvent.setup();
  api.createTeacher.mockResolvedValue({ teacher: { id: 3, username: "neu", isMaster: false, studentCount: 0 } });

  render(<TeachersDialog onClose={jest.fn()} currentUserId={1} />);
  await user.type(await screen.findByLabelText("Neue Lehrkraft"), "neu");
  await user.type(screen.getByLabelText("Passwort"), "passwort1");
  await user.click(screen.getByRole("button", { name: "Anlegen" }));
  expect(api.createTeacher).toHaveBeenCalledWith("neu", "passwort1");
});
