"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
// const jobFilterSchema = require("../schemas/jobFilter.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary (optional), equity (optional), companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: login, is admin
 */
router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {

  //console.log("request body is--->", req.body);
  let jobCriteria = req.body;

  if (Object.keys(jobCriteria).includes("equity")) {
    if (+jobCriteria["equity"] === NaN || +jobCriteria["equity"] > 1.0) {
      throw new BadRequestError("Equity string needs to be numeric and below 1.0.");
    }
  }

  const validator = jsonschema.validate(jobCriteria, jobNewSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(jobCriteria);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Authorization required: none
 */

router.get("/", async function(req, res, next) {
  let jobs = await Job.findAll();

  return res.json({ jobs });
})

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

 router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login, is admin
 */

 router.patch("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, jobUpdateSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.handle, req.body);
  return res.json({ job });
});




//TODO Add remaining routes for job retrieval (including option to filter), updating and deleting

module.exports = router;
