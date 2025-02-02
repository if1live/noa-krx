import { assert, describe, it } from "vitest";
import { MyDateMod } from "../src/mod.js";
import type { MyDate } from "../src/types.js";

describe("MyDateExt#parse", () => {
  it("20120304", () => {
    const input = "20120304";
    const actual = MyDateMod.parse(input);
    assert.strictEqual(actual, "2012-03-04");
  });

  it("2012.03.04", () => {
    const input = "2012.03.04";
    const actual = MyDateMod.parse(input);
    assert.strictEqual(actual, "2012-03-04");
  });

  it("2012-03-04", () => {
    const input = "2012-03-04";
    const actual = MyDateMod.parse(input);
    assert.strictEqual(actual, "2012-03-04");
  });

  it("2012/03/04", () => {
    const input = "2012/03/04";
    const actual = MyDateMod.parse(input);
    assert.strictEqual(actual, "2012-03-04");
  });
});

describe("MyDateExt#split", () => {
  it("ok", () => {
    const input: MyDate = "2021-12-31";
    const split = MyDateMod.split(input);
    assert.deepStrictEqual(split, ["2021", "12", "31"]);
  });
});
