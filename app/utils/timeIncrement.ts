import { addMinutes, format } from "date-fns";

interface TimeRange {
  startTime: string;
  endTime: string;
}

/**
 * Increments a time range by 15 minutes.
 * Takes the current startTime, adds 15 minutes, and sets the new endTime to be +15 minutes from the new start.
 * @param currentStartTime - Current start time in "HH:mm" format
 * @returns New time range with updated start and end times
 */
export function increment15Minutes(currentStartTime: string): TimeRange {
  const [hours, minutes] = currentStartTime.split(":").map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  const newStartTime = addMinutes(startDate, 15);
  const newEndTime = addMinutes(newStartTime, 15);

  return {
    startTime: format(newStartTime, "HH:mm"),
    endTime: format(newEndTime, "HH:mm"),
  };
}
