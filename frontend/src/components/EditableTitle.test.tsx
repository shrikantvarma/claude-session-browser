import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EditableTitle } from "./EditableTitle";

describe("EditableTitle", () => {
  it("renders value text in display mode", () => {
    render(<EditableTitle value="My Session" onSave={vi.fn()} />);
    expect(screen.getByText("My Session")).toBeInTheDocument();
  });

  it("clicking switches to edit mode with input", async () => {
    const user = userEvent.setup();
    render(<EditableTitle value="My Session" onSave={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("My Session");
  });

  it("pressing Enter saves and exits edit mode", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<EditableTitle value="My Session" onSave={onSave} />);

    await user.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "New Title{Enter}");

    expect(onSave).toHaveBeenCalledWith("New Title");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("pressing Escape cancels without saving", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<EditableTitle value="My Session" onSave={onSave} />);

    await user.click(screen.getByRole("button"));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Changed{Escape}");

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("My Session")).toBeInTheDocument();
  });

  it("blur saves the current value", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <div>
        <EditableTitle value="My Session" onSave={onSave} />
        <button>Other</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /my session/i }));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Blur Title");
    await user.click(screen.getByRole("button", { name: "Other" }));

    expect(onSave).toHaveBeenCalledWith("Blur Title");
  });
});
