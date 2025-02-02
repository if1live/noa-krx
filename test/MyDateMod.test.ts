import { assert, describe, it } from "vitest";
import { MyDateMod } from "../src/mod.js";
import type { MyDate } from "../src/types.js";

describe("MyDateMod#parse", () => {
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

describe("MyDateMod#split", () => {
  it("ok", () => {
    const input: MyDate = "2021-12-31";
    const split = MyDateMod.split(input);
    assert.deepStrictEqual(split, ["2021", "12", "31"]);
  });
});

describe("MyDateMod#addDay", () => {
  it("2012-03-04 + 1", () => {
    const input = "2012-03-04";
    const actual = MyDateMod.addDay(input, 1);
    assert.strictEqual(actual, "2012-03-05");
  });
});

describe("MyDate#diffDay", () => {
  it("2012-03-04 ~ 2012-03-05", () => {
    const date1 = "2012-03-04";
    const date2 = "2012-03-05";
    const actual = MyDateMod.diffDay(date1, date2);
    assert.strictEqual(actual, 1);
  });
});
