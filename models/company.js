"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Dynamically generates injection safe SQL for filtering
 * Accepts an object of data to filter.
 * 
 * Returns an object with two keys, first key's value being a string of the
 * SQL-friendly WHERE clause for filtering, including SQL injection-safe
 * placeholders ($1, $2, etc), which can be inserted directly into the WHERE
 * clause. The second key's value will be an array of all the values corresponding
 * to the placeholder values.
 * 
 * Throws BadRequestError if invalid criteria.
 * 
 * TODO include example of input+output
 * 
 */

  static _sqlForFilteringCompanies(dataToFilter) {
    const keys = Object.keys(dataToFilter);
    if (dataToFilter.minEmployees > dataToFilter.maxEmployees) {
      throw new BadRequestError("Bad criteria");
    };

    let values = [];

    const criteria = keys.map(function (criteriaName, idx) {
      if (criteriaName === "minEmployees") {
        values.push(dataToFilter[criteriaName]);
        return `num_employees >= $${idx + 1}`;
      }
      else if (criteriaName === "maxEmployees") {
        values.push(dataToFilter[criteriaName]);
        return `num_employees <= $${idx + 1}`;
      }
      else if (criteriaName === "name") {
        values.push(`%${dataToFilter[criteriaName]}%`);
        return `name ILIKE $${idx + 1}`;
      }
    });
    return {
      setCriteria: criteria.join(" AND "),
      values: values
    };
  };

  /** Given query parameters for companies, return data about companies that meet criteria
   * Accepts {name: "net", minEmployees: 1}
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   */
  static async filterCompanies(data) {
    // console.log("filterCompanies data --->", data)
    const { setCriteria, values } = this._sqlForFilteringCompanies(data);
    // console.log("setCriteria filterCompanies --->", setCriteria)
    // console.log("values filterCompanies", values)
    const companiesRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE ${setCriteria}
           ORDER BY name`,
      values
    );
    // console.log("companiesRes from filterCompanies--->", companiesRes.rows)
    return companiesRes.rows;
  };

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
