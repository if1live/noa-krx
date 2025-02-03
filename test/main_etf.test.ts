import { assert, describe, it } from "vitest";
import { Input } from "../main_etf.js";
import type { MyDate } from "../src/types.js";

describe("main_etf#Input", () => {
  it("date: ok", () => {
    const input = { dataDir: "data", date: "2025-02-01" };
    const actual = Input.parse(input);

    const date: MyDate = actual.date;
    assert.strictEqual(date, "2025-02-01");
  });

  it("date: invalid", () => {
    const input = { dataDir: "data", date: "20250201" };
    assert.throw(() => Input.parse(input));
  });
});
