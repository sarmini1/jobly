"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    jobIds
} = require("./_testCommon");
// const testCommon = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: 'testjob3',
        salary: 60000,
        equity: '0',
        companyHandle: 'c3'
    };
    const badJob = {
        title: "testjob4",
        salary: 60000,
        equity: "0",
        companyHandle: "scam"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({...newJob, id: expect.any(Number)});

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle as "companyHandle"
             FROM jobs
             WHERE company_handle = 'c3'`);
        console.log("result.rows for createjob", result.rows)
        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "testjob3",
                salary: 60000,
                equity: "0",
                companyHandle: "c3"
            },
        ]);
    });

    test("bad request: company doesn't exist", async function () {
        try {
            await Job.create(badJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: 'testjob1',
                salary: 50000,
                equity: "0",
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: 'testjob2',
                salary: 150000,
                equity: "0.045",
                companyHandle: 'c2'
            },
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        console.log("jobIds Array from get test", jobIds[0])
        let job = await Job.get(jobIds[0]);
        expect(job).toEqual({
            id: jobIds[0],
            title: 'testjob1',
            salary: 50000,
            equity: "0",
            companyHandle: 'c1'
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
      salary: 45000,
      title: "updatedJob"
    };
  
    test("works", async function () {
      let company = await Job.update(jobIds[0], updateData);
      expect(company).toEqual({
        companyHandle: "c1",
        equity: "0",
        id: jobIds[0],
        ...updateData,
      });
  
      const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE id = $1`,
             [jobIds[0]]);
      expect(result.rows).toEqual([{
        companyHandle: "c1",
        equity: "0",
        id: jobIds[0],
        ...updateData,
      }]);
    });
  
    test("works: null fields", async function () {
      const updateDataSetNulls = {
        salary: null
      };
  
      let job = await Job.update(jobIds[0], updateDataSetNulls);
      expect(job).toEqual({
        companyHandle: "c1",
        equity: "0",
        id: jobIds[0],
        title: "testjob1",
        salary: null
      });
  
      const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [jobIds[0]]);
      expect(result.rows).toEqual([{
        companyHandle: "c1",
        equity: "0",
        id: jobIds[0],
        title: "testjob1",
        salary: null
      }]);
    });

    test("cannot update company handle", async function () {
        try {
          await Job.update(jobIds[0], {companyHandle: "moo"});
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });

      test("cannot update job id", async function () {
        try {
          await Job.update(jobIds[0], {id: 0});
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
  
    test("not found if no such company", async function () {
      try {
        await Job.update(0, updateData);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  
    test("bad request with no data", async function () {
      try {
        await Job.update(jobIds[0], {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
      await Job.remove(jobIds[0]);
      const res = await db.query(
          `SELECT id
          FROM jobs 
          WHERE id=$1`,
          [jobIds[0]]);
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such job", async function () {
      try {
        await Job.remove(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });

//TODO add additional tests for filtering jobs