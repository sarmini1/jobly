const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");


describe("sqlForPartialUpdate", function () {
  test("works: valid data", function () {
    const result = sqlForPartialUpdate(
      {
        testKey: "change to this",
        anotherKey: "also change this"
      },
      {
        testKey: "test_key_column",
        anotherKey: "another_key_column"
      }
    )
    console.log("PARTIAL UPDATE RESULT IS --->", result);
    expect(result).toEqual(
      {
        setCols: '"test_key_column"=$1, "another_key_column"=$2',
        values: ["change to this", "also change this"]
      }
    )

  });

  test("works: missing data", function () {
    try {
      const result = sqlForPartialUpdate(
        {},
        {
          testKey: "test_key_column",
          anotherKey: "another_key_column"
        }
      )
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});