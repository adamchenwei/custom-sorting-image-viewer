import { increment15Minutes } from "./timeIncrement";

describe("increment15Minutes", () => {
  it("should increment start time by 15 minutes and set end time 15 minutes after", () => {
    const result = increment15Minutes("10:00");
    expect(result.startTime).toBe("10:15");
    expect(result.endTime).toBe("10:30");
  });

  it("should handle time near end of hour", () => {
    const result = increment15Minutes("10:45");
    expect(result.startTime).toBe("11:00");
    expect(result.endTime).toBe("11:15");
  });

  it("should handle time near midnight", () => {
    const result = increment15Minutes("23:45");
    expect(result.startTime).toBe("00:00");
    expect(result.endTime).toBe("00:15");
  });

  it("should handle single digit minutes", () => {
    const result = increment15Minutes("09:05");
    expect(result.startTime).toBe("09:20");
    expect(result.endTime).toBe("09:35");
  });
});
