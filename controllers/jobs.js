const Job = require("../models/Job");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const moment = require("moment");
const mongoose = require("mongoose");

const getStats = async (req, res) => {
  let stats = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    { $group: { _id: "$status", count: { $count: {} } } },
  ]);

  stats = stats.reduce((object, status) => {
    object[status._id] = status.count;
    return object;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  let monthlyApplications = await Job.aggregate([
    // match
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    // group
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $count: {} },
      },
      // sort
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },

    // limit
    { $limit: 6 },
  ]);

  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      const date = moment()
        .month(month - 1)
        .year(year)
        .format("MMM Y");
      return { date, count };
    })
    .reverse();
  console.log(monthlyApplications);

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
};

const getAllJobs = async (req, res) => {
  const { status, jobType, search, sort } = req.query;
  const queryObject = {
    createdBy: req.user.userId,
  };

  if (search) {
    queryObject.position = { $regex: search, $options: "i" };
  }

  if (status && status !== "all") {
    queryObject.status = status;
  }
  if (jobType && jobType !== "all") {
    queryObject.jobType = jobType;
  }

  let result = Job.find(queryObject);

  // more logic here so await comes later, however that works?
  if (sort === "oldest") {
    result = result.sort("createdAt");
  }
  if (sort === "latest") {
    result = result.sort("-createdAt");
  }
  if (sort === "a-z") {
    result = result.sort("company");
  }
  if (sort === "z-a") {
    result = result.sort("-company");
  }

  const page = Number(req.query.page) || 3;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.limit(limit).skip(skip);

  const jobs = await result;

  const totalJobs = await Job.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalJobs / limit);

  res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages });
};
const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  });
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId;
  const job = await Job.create(req.body);
  res.status(StatusCodes.CREATED).json({ job });
};

const updateJob = async (req, res) => {
  const {
    body: { company, position, type, status, location },
    user: { userId },
    params: { id: jobId },
  } = req;

  if (company === "" || position === "" || location === "") {
    throw new BadRequestError(
      "Company, Position and location fields cannot be empty"
    );
  }
  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  });
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).send();
};

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  getStats,
};
