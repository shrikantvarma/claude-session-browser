import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FilterBar } from "./FilterBar";

vi.mock("../api/queries", () => ({
  useStats: vi.fn(),
}));

import { useStats } from "../api/queries";

const mockUseStats = vi.mocked(useStats);

function setupStatsWithProjects() {
  mockUseStats.mockReturnValue({
    data: {
      totalSessions: 50,
      totalMessages: 200,
      projects: ["my-project", "api-server", "frontend"],
    },
    isLoading: false,
    isError: false,
    error: null,
  } as ReturnType<typeof useStats>);
}

describe("FilterBar", () => {
  it('renders a project dropdown with "All Projects" as first option', () => {
    setupStatsWithProjects();

    render(
      <FilterBar
        onProjectChange={vi.fn()}
        onDateRangeChange={vi.fn()}
        selectedProject={null}
        dateStart={null}
        dateEnd={null}
      />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("All Projects");
  });

  it("renders project names from useStats() in the dropdown", () => {
    setupStatsWithProjects();

    render(
      <FilterBar
        onProjectChange={vi.fn()}
        onDateRangeChange={vi.fn()}
        selectedProject={null}
        dateStart={null}
        dateEnd={null}
      />,
    );

    expect(screen.getByRole("option", { name: "my-project" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "api-server" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "frontend" })).toBeInTheDocument();
  });

  it("calls onProjectChange when a project is selected", async () => {
    setupStatsWithProjects();
    const onProjectChange = vi.fn();

    render(
      <FilterBar
        onProjectChange={onProjectChange}
        onDateRangeChange={vi.fn()}
        selectedProject={null}
        dateStart={null}
        dateEnd={null}
      />,
    );

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "my-project");
    expect(onProjectChange).toHaveBeenCalledWith("my-project");
  });

  it("renders date range inputs (From / To)", () => {
    setupStatsWithProjects();

    render(
      <FilterBar
        onProjectChange={vi.fn()}
        onDateRangeChange={vi.fn()}
        selectedProject={null}
        dateStart={null}
        dateEnd={null}
      />,
    );

    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });

  it("calls onDateRangeChange when dates are changed", async () => {
    setupStatsWithProjects();
    const onDateRangeChange = vi.fn();

    render(
      <FilterBar
        onProjectChange={vi.fn()}
        onDateRangeChange={onDateRangeChange}
        selectedProject={null}
        dateStart={null}
        dateEnd={null}
      />,
    );

    const fromInput = screen.getByLabelText("From");
    await userEvent.type(fromInput, "2026-03-01");
    expect(onDateRangeChange).toHaveBeenCalled();
  });

  it('shows "Clear" button only when a filter is active', () => {
    setupStatsWithProjects();

    const { rerender } = render(
      <FilterBar
        onProjectChange={vi.fn()}
        onDateRangeChange={vi.fn()}
        selectedProject={null}
        dateStart={null}
        dateEnd={null}
      />,
    );

    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();

    rerender(
      <FilterBar
        onProjectChange={vi.fn()}
        onDateRangeChange={vi.fn()}
        selectedProject="my-project"
        dateStart={null}
        dateEnd={null}
      />,
    );

    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it('clicking "Clear" resets all filters', async () => {
    setupStatsWithProjects();
    const onProjectChange = vi.fn();
    const onDateRangeChange = vi.fn();

    render(
      <FilterBar
        onProjectChange={onProjectChange}
        onDateRangeChange={onDateRangeChange}
        selectedProject="my-project"
        dateStart="2026-03-01"
        dateEnd="2026-03-20"
      />,
    );

    const clearButton = screen.getByRole("button", { name: /clear/i });
    await userEvent.click(clearButton);
    expect(onProjectChange).toHaveBeenCalledWith(null);
    expect(onDateRangeChange).toHaveBeenCalledWith(null, null);
  });
});
