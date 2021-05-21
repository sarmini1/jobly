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
  admin1Token
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

//TODO add additional route tests for job retrieval (including filtering), updating, and deleting