import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClassesDialog from "./ClassesDialog";
import StudentDialog from "./StudentDialog";
import { api } from "../lib/api";

jest.mock("../lib/api", () => ({
  api: {
    createClass: jest.fn(),
    updateClass: jest.fn(),
    deleteClass: jest.fn(),
    createStudent: jest.fn(),
    updateStudent: jest.fn(),
  },
}));

const CLASSES = [
  { id: 1, name: "9a", studentCount: 2 },
  { id: 2, name: "9b", studentCount: 0 },
];

beforeEach(() => jest.clearAllMocks());

test("Klasse anlegen, umbenennen und löschen", async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  api.createClass.mockResolvedValue({ class: { id: 3, name: "10c", studentCount: 0 } });
  api.updateClass.mockResolvedValue({ class: { id: 1, name: "9a neu", studentCount: 2 } });
  api.deleteClass.mockResolvedValue(null);

  render(<ClassesDialog classes={CLASSES} onChange={onChange} onClose={jest.fn()} />);
  expect(screen.getByText("(2 Personen)")).toBeInTheDocument();

  await user.type(screen.getByLabelText("Name der neuen Klasse"), "10c");
  await user.click(screen.getByRole("button", { name: "Anlegen" }));
  expect(api.createClass).toHaveBeenCalledWith("10c");
  expect(onChange.mock.calls[0][0].map((c) => c.name)).toEqual(["10c", "9a", "9b"]);

  await user.click(screen.getByRole("button", { name: "9a umbenennen" }));
  await user.clear(screen.getByLabelText("Neuer Name für 9a"));
  await user.type(screen.getByLabelText("Neuer Name für 9a"), "9a neu");
  await user.click(screen.getByRole("button", { name: "Speichern" }));
  expect(api.updateClass).toHaveBeenCalledWith(1, "9a neu");

  await user.click(screen.getByRole("button", { name: "9b löschen" }));
  expect(screen.getByText(/Die Schüler\/-innen bleiben erhalten/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Löschen" }));
  expect(api.deleteClass).toHaveBeenCalledWith(2);
});

test("Fehler des Servers werden angezeigt", async () => {
  const user = userEvent.setup();
  api.createClass.mockRejectedValue(new Error("Eine Klasse mit diesem Namen existiert bereits."));
  render(<ClassesDialog classes={CLASSES} onChange={jest.fn()} onClose={jest.fn()} />);
  await user.type(screen.getByLabelText("Name der neuen Klasse"), "9a");
  await user.click(screen.getByRole("button", { name: "Anlegen" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("existiert bereits");
});

test("Schüler/-in wird mit ausgewählter Klasse angelegt", async () => {
  const user = userEvent.setup();
  api.createStudent.mockResolvedValue({ student: { id: 7, username: "anna", classId: 2, passedLevels: [] } });

  render(<StudentDialog levels={[1, 2]} classes={CLASSES} onClose={jest.fn()} onSaved={jest.fn()} />);
  await user.type(screen.getByLabelText("Benutzername"), "anna");
  await user.type(screen.getByLabelText("Passwort"), "geheim123");
  await user.selectOptions(screen.getByLabelText("Klasse"), "2");
  await user.click(screen.getByRole("button", { name: "Anlegen" }));
  expect(api.createStudent).toHaveBeenCalledWith("anna", "geheim123", 2);
});

test("Beim Bearbeiten lassen sich Klasse und Level ändern", async () => {
  const user = userEvent.setup();
  api.updateStudent.mockResolvedValue({ student: { id: 7, username: "anna", classId: null, passedLevels: [1] } });
  const student = { id: 7, username: "anna", classId: 1, passedLevels: [] };

  render(<StudentDialog student={student} levels={[1, 2]} classes={CLASSES} onClose={jest.fn()} onSaved={jest.fn()} />);
  expect(screen.getByLabelText("Klasse")).toHaveValue("1");
  await user.selectOptions(screen.getByLabelText("Klasse"), "");
  await user.click(screen.getByRole("checkbox", { name: "Level 1" }));
  await user.click(screen.getByRole("button", { name: "Speichern" }));
  expect(api.updateStudent).toHaveBeenCalledWith(7, { passedLevels: [1], classId: null });
});
