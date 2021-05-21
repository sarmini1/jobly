"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  admin1Token,
  jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "newJob",
    salary: 100000,
    equity: "0.001",
    companyHandle: "c1"
  };

  test("ok for admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${admin1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({job: {...newJob, id: expect.any(Number)}});
  });

  test("not ok for non-admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("non-admin-- unauthorized bad request w/ missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 10
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("admin-- authorized bad request w/ missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 10
      })
      .set("authorization", `Bearer ${admin1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("admin-- bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: 17,
        salary: "not-a-salary",
        companyHandle: "c1"
      })
      .set("authorization", `Bearer ${admin1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("admin-- bad request with invalid equity amt", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "valid title",
        equity: "1.1",
        companyHandle: "c1"
      })
      .set("authorization", `Bearer ${admin1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
            {
              id: expect.any(Number),
              title: "j1",
              salary: 15000,
              equity: "0.021",
              companyHandle: "c1"
            },
            {
              id: expect.any(Number),
              title: "j2",
              salary: 15000,
              equity: "0.025",
              companyHandle: "c2"
            }
        ],
    });
  });

  // test("accepts query for filtering by min", async function () {
  //   const resp = await request(app).get("/companies?minEmployees=3")
  //   expect(resp.body).toEqual({
  //     companies:
  //       [
  //         {
  //           handle: "c3",
  //           name: "C3",
  //           description: "Desc3",
  //           numEmployees: 3,
  //           logoUrl: "http://c3.img",
  //         }
  //       ],
  //   });
  // });

  // test("accepts query for filtering by max", async function () {
  //   const resp = await request(app).get("/companies?maxEmployees=1")
  //   expect(resp.body).toEqual({
  //     companies:
  //       [
  //         {
  //           handle: "c1",
  //           name: "C1",
  //           description: "Desc1",
  //           numEmployees: 1,
  //           logoUrl: "http://c1.img",
  //         }
  //       ],
  //   });
  // });

  // test("accepts queries for filtering w multiple queries", async function () {
  //   const resp = await request(app).get("/companies?minEmployees=1&name=c");
  //   expect(resp.body).toEqual({
  //     companies:
  //       [
  //         {
  //           handle: "c1",
  //           name: "C1",
  //           description: "Desc1",
  //           numEmployees: 1,
  //           logoUrl: "http://c1.img",
  //         },
  //         {
  //           handle: "c2",
  //           name: "C2",
  //           description: "Desc2",
  //           numEmployees: 2,
  //           logoUrl: "http://c2.img",
  //         },
  //         {
  //           handle: "c3",
  //           name: "C3",
  //           description: "Desc3",
  //           numEmployees: 3,
  //           logoUrl: "http://c3.img",
  //         },
  //       ],
  //   });
  // });

  // test("fails: inappropriate filtering fields", async function () {
  //   const resp = await request(app).get("/companies?officeCats=3")
  //   expect(resp.statusCode).toEqual(400);
  // });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
          id: expect.any(Number),
          title: "j1",
          salary: 15000,
          equity: "0.021",
          companyHandle: "c1"
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "updatedjob",
        salary: 150000,
      })
      .set("authorization", `Bearer ${admin1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: jobIds[0],
        title: "updatedjob",
        salary: 150000,
        equity: "0.021",
        companyHandle: "c1"
      },
    });
  });

  test("doesn't work for non-admin users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "updatedjob",
      })
      .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "updatedjob",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("admin-- not found where no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "nope",
      })
      .set("authorization", `Bearer ${admin1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("non-admin-- unauthorized for no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("admin-- bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        id: 0,
      })
      .set("authorization", `Bearer ${admin1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("admin-- bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        equity: "notequity",
      })
      .set("authorization", `Bearer ${admin1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});



//TODO add additional route tests for job retrieval (including filtering), updating, and deleting