const express = require("express");
const testUser = require("../middleware/testUser");
const Job = require("../models/Job");
const router = express.Router();
const {
  getStats,
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
} = require("../controllers/jobs");

router.route("/").post(testUser, createJob).get(getAllJobs);
router.route("/stats").get(getStats);
router
  .route("/:id")
  .get(testUser, getJob)
  .delete(testUser, deleteJob)
  .patch(testUser, updateJob);

module.exports = router;
