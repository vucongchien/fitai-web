
import { fireEvent, render, screen } from "@testing-library/react";

import { AvailabilityScheduler } from "../../src/features/onboarding/ui/components/scheduler/availability-scheduler";
import { defaultWeek } from "../../src/features/onboarding/ui/components/scheduler/types";

describe("availabilityScheduler Component", () => {
  it("renders 7 weekday rows with 3-letter labels", () => {
    render(<AvailabilityScheduler defaultValue={defaultWeek()} />);

    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("toggles day availability when switch is clicked", () => {
    const handleChange = vi.fn();
    render(<AvailabilityScheduler defaultValue={defaultWeek()} onChange={handleChange} />);

    // Toggle Tue (currently disabled)
    const tuesdayToggle = screen.getByLabelText("Toggle availability for Tue");
    fireEvent.click(tuesdayToggle);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tue: expect.objectContaining({ enabled: true }),
      }),
    );
  });

  it("updates start time when select value changes", () => {
    const handleChange = vi.fn();
    render(<AvailabilityScheduler defaultValue={defaultWeek()} onChange={handleChange} />);

    const startSelect = screen.getByLabelText("Start time for Mon");
    fireEvent.change(startSelect, { target: { value: "06:00" } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mon: expect.objectContaining({
          ranges: [expect.objectContaining({ start: "06:00" })],
        }),
      }),
    );
  });

  it("updates end time when select value changes", () => {
    const handleChange = vi.fn();
    render(<AvailabilityScheduler defaultValue={defaultWeek()} onChange={handleChange} />);

    const endSelect = screen.getByLabelText("End time for Mon");
    fireEvent.change(endSelect, { target: { value: "07:30" } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mon: expect.objectContaining({
          ranges: [expect.objectContaining({ end: "07:30" })],
        }),
      }),
    );
  });

  it("shows rest day label when day is disabled", () => {
    render(<AvailabilityScheduler defaultValue={defaultWeek()} />);
    const restDayLabels = screen.getAllByText("Rest");
    expect(restDayLabels.length).toBeGreaterThan(0);
  });
});
