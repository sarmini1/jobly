"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    jobIdsArray
} = require("./_testCommon");
// const testCommon = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "testjob3",
        salary: 60000,
        equity: "0",
        company_handle: "c3"
    };
    const badJob = {
        title: "testjob4",
        salary: 60000,
        equity: "0",
        company_handle: "scam"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({...newJob, id: expect.any(Number)});

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE company_handle = 'c3'`);
        console.log("result.rows for createjob", result.rows)
        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "testjob3",
                salary: 60000,
                equity: "0",
                company_handle: "c3"
            },
        ]);
    });

    // TODO: come back to this test, what does FK impossible ref return
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
                company_handle: 'c1'
            },
            {
                id: expect.any(Number),
                title: 'testjob2',
                salary: 150000,
                equity: "0.045",
                company_handle: 'c2'
            },
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        console.log("jobIds Array from get test", jobIdsArray[0])
        let job = await Job.get(jobIdsArray[0]);
        expect(job).toEqual({
            id: jobIdsArray[0],
            title: 'testjob1',
            salary: 50000,
            equity: "0",
            company_handle: 'c1'
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