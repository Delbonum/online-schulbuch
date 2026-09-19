import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Paginated from "./Paginated";

const items = Array.from({ length: 14 }, (_, i) => `Eintrag ${i + 1}`);
const renderList = (list) => (
  <ul>
    {list.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

test("zeigt nur eine Seite und blättert weiter", async () => {
  const user = userEvent.setup();
  render(
    <Paginated items={items} perPage={6} label="Anfragen">
      {renderList}
    </Paginated>,
  );

  expect(screen.getAllByRole("listitem")).toHaveLength(6);
  expect(screen.getByText("1–6 von 14 Anfragen")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Vorherige Seite/ })).toBeDisabled();

  await user.click(screen.getByRole("button", { name: /Nächste Seite/ }));
  expect(screen.getByText("Eintrag 7")).toBeInTheDocument();
  expect(screen.queryByText("Eintrag 6")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Nächste Seite/ }));
  expect(screen.getByText("13–14 von 14 Anfragen")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Nächste Seite/ })).toBeDisabled();
});

test("ohne Überlänge gibt es keine Blätter-Schaltflächen", () => {
  render(
    <Paginated items={items.slice(0, 4)} perPage={6}>
      {renderList}
    </Paginated>,
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(4);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
