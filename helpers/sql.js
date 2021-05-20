"use strict";

const { BadRequestError } = require("../expressError");

/** Dynamically generates injection safe SQL for updating
 * Accepts two parameters-- an object of data to update, and an object
 * that maps the Javascript key to the matching table column name.
 * If no data is passed in to update, throws an error.
 * 
 * Returns an object with two keys, first key's value being a string of the 
 * SQL-friendly list of column names that we will set, corresponding to their
 * SQL injection-safe representations ($1, $2, $3, and so on), which can be
 * inserted directly into an UPDATE statement. The second key's value will be an
 * array of all the values that will be updated, which can ultimately be passed
 * into the 2nd parameter of a db.query call.
 * 
 * Include: input + output example
 * 
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
