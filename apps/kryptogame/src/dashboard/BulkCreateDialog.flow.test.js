import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BulkCreateDialog from "./BulkCreateDialog";
import { api } from "../lib/api";

jest.mock("../lib/api", () => ({
  api: { createClass: jest.fn(), createStudent: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

test("legt bei Bedarf zuerst eine neue Klasse an", async () => {
  const user = userEvent.setup();
  api.createClass.mockResolvedValue({ class: { id: 5, name: "9c", studentCount: 0 } });
  api.createStudent.mockImplementation((username) =>
    Promise.resolve({ student: { id: 1, username, classId: 5, passedLevels: [] } }),
  );

  render(
    <BulkCreateDialog classes={[{ id: 1, name: "9a", studentCount: 0 }]} onClose={jest.fn()} onCreated={jest.fn()} />,
  );

  await user.selectOptions(screen.getByLabelText("Klasse"), "new");
  await user.type(screen.getByLabelText("Name der neuen Klasse"), "9c");
  await user.type(screen.getByLabelText(/Ein Name pro Zeile/), "Max Mustermann\nErika Musterfrau");
  await user.click(screen.getByRole("button", { name: /2 Zugänge anlegen/ }));

  expect(api.createClass).toHaveBeenCalledWith("9c");
  expect(api.createStudent).toHaveBeenCalledTimes(2);
  expect(api.createStudent.mock.calls[0][0]).toBe("max.mustermann");
  expect(api.createStudent.mock.calls[0][2]).toBe(5);
  expect(await screen.findByText(/2 von 2 Zugängen angelegt/)).toBeInTheDocument();
});

test("bricht ab, wenn die neue Klasse nicht angelegt werden kann", async () => {
  const user = userEvent.setup();
  api.createClass.mockRejectedValue(new Error("Eine Klasse mit diesem Namen existiert bereits."));

  render(<BulkCreateDialog classes={[]} onClose={jest.fn()} onCreated={jest.fn()} />);
  await user.selectOptions(screen.getByLabelText("Klasse"), "new");
  await user.type(screen.getByLabelText("Name der neuen Klasse"), "9a");
  await user.type(screen.getByLabelText(/Ein Name pro Zeile/), "Max Mustermann");
  await user.click(screen.getByRole("button", { name: /1 Zugänge anlegen/ }));

  expect(await screen.findByRole("alert")).toHaveTextContent("existiert bereits");
  expect(api.createStudent).not.toHaveBeenCalled();
});
