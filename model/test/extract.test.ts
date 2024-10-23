import { describe, it, expect } from "vitest";
import { parseSetItemLine } from "../src/extract";
import { SetItemSchema } from "../src/schemas/workout";

describe("parseSetItemLine", () => {
  it("should parse a valid set item line with special character ©", () => {
    const input = "© 2X50 Drill 1:10";
    const result = parseSetItemLine(input);

    const expected = {
      repeat: 2,
      distance: 50,
      effort: "",
      note: "",
      stroke: "Drill",
      time: "1:10",
    };

    // Validate the result against the Zod schema
    const parsedResult = SetItemSchema.parse(result);

    expect(parsedResult).toEqual(expected);
  });
});
