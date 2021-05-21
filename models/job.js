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
    static async create({ title, salary, equity, company_handle }) {

        const companyCheck = await db.query(
            `SELECT handle
                FROM companies
                WHERE handle = $1`,
            [company_handle]
        );
        // console.log("company_handle from create--->", company_handle)
        // console.log("companyCheck.rows--->", companyCheck.rows)
        if (!companyCheck.rows[0]) {
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

   /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */
    static async findAll() {
        const jobsRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle as "companyHandle"
               FROM jobs
               ORDER BY title`);
        return jobsRes.rows;
    }

   /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/
    static async get(id) {
        const jobsRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle as "companyHandle"
               FROM jobs
               WHERE id = $1`,
            [id]);
        console.log("jobresults from getjob", jobsRes.rows)

        const job = jobsRes.rows[0];
        console.log("job from getjob", job)
        if (!job) throw new NotFoundError(`That job doesn't exist`);

        return job;
    }

    /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */
    static async update(id, data) {
        if(Object.keys(data).includes("id")) throw new BadRequestError();
        if(Object.keys(data).includes("companyHandle")) throw new BadRequestError();
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `
        UPDATE jobs
        SET ${setCols}
          WHERE id = ${handleVarIdx}
          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if(!job) throw new NotFoundError("Job not found");

        return job;
    }




}

module.exports = Job;