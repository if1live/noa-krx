import { assert, describe, it } from "vitest";
import { MyDateMod } from "../../src/krx/mod.js";
import type { MyDate } from "../../src/krx/types.js";

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

describe("MyDateMod#diffDay", () => {
  it("2012-03-04 ~ 2012-03-05", () => {
    const date1 = "2012-03-04";
    const date2 = "2012-03-05";
    const actual = MyDateMod.diffDay(date1, date2);
    assert.strictEqual(actual, 1);
  });
});

describe("MyDateMod#schema", () => {
  const schema = MyDateMod.schema();

  it("date: ok", () => {
    const input = "2025-02-01";
    const actual = schema.parse(input);

    const date: MyDate = actual;
    assert.strictEqual(date, "2025-02-01");
  });

  it("date: invalid", () => {
    const input = "20250201";
    assert.throw(() => schema.parse(input));
  });
});

describe("MyDateMod#isWeekendInKST", () => {
  it("ok", () => {
    assert.strictEqual(MyDateMod.isWeekendInKST("2025-02-07"), false); // 금요일

    assert.strictEqual(MyDateMod.isWeekendInKST("2025-02-08"), true); // 토요일
    assert.strictEqual(MyDateMod.isWeekendInKST("2025-02-09"), true); // 일요일
  });
});
