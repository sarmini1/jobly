"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   * Salary and Equity are not required.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company_handle doesn't exist.
   * */
    static async create({title, salary, equity, company_handle}) {

        const companyCheck = await db.query(
            `SELECT handle
                FROM companies
                WHERE handle = $1`,
            [company_handle]
        );
        // console.log("company_handle from create--->", company_handle)
        // console.log("companyCheck.rows--->", companyCheck.rows)
        if(!companyCheck.rows[0]){
            throw new BadRequestError(`Company ${company_handle} doesn't exist.`);
        }

        const result = await db.query(
            `INSERT INTO jobs(
                title,
                salary,
                equity,
                company_handle)
                 VALUES
                   ($1, $2, $3, $4)
                 RETURNING id, title, salary, equity, company_handle`,
                 [title, salary, equity, company_handle]
        );
        const job = result.rows[0];

        return job;
    }

    static async findAll() {
        const jobsRes = await db.query(
          `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle
               FROM jobs
               ORDER BY title`);
        return jobsRes.rows;
      }

      static async get(id) {
        const jobsRes = await db.query(
          `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle
               FROM jobs
               WHERE id = $1`,
          [id]);
        console.log("jobresults from getjob", jobsRes.rows)
    
        const job = jobsRes.rows[0];
        console.log("job from getjob", job)
        if (!job) throw new NotFoundError(`That job doesn't exist`);
    
        return job;
      }
}

module.exports = Job;