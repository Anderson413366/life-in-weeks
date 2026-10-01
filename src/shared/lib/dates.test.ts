import { describe, expect, it } from "vitest";
import { addWeeks, format } from "date-fns";

import { formatLocalDate, parseStoredDate } from "./dates";

describe("parseStoredDate", () => {
  it("keeps YYYY-MM-DD values on the intended calendar day", () => {
    const birthDate = parseStoredDate("1990-01-01");

    expect(birthDate).not.toBeNull();
    expect(birthDate?.getFullYear()).toBe(1990);
    expect(birthDate?.getMonth()).toBe(0);
    expect(birthDate?.getDate()).toBe(1);
    expect(format(addWeeks(birthDate!, 0), "MMM d, yyyy")).toBe("Jan 1, 1990");
  });

  it("rejects invalid stored dates", () => {
    expect(parseStoredDate("1990-02-30")).toBeNull();
    expect(parseStoredDate("not-a-date")).toBeNull();
  });
});

describe("formatLocalDate", () => {
  it("uses the local calendar day instead of UTC rollover", () => {
    const localEvening = new Date("2026-04-01T22:30:00-04:00");

    expect(formatLocalDate(localEvening)).toBe("2026-04-01");
  });
});
