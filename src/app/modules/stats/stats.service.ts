import { redisClient } from "../../config/redis.config.js";
import Enrollment from "../enrollment/enrollment.model.js";
import { PAYMENT_STATUS } from "../payment/payment.interface.js";
import Payment from "../payment/payment.model.js";
import { IsActive } from "../user/user.interface.js";
import User from "../user/user.model.js";
import { WorkShop } from "../workshop/workshop.model.js";

const getUsersStats = async () => {
  const CACHE_KEY = "stats:admin:users";
  const CACHE_TTL = 300;
  try {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // Falls through to DB operation
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalUsersPromise = User.countDocuments({ isDeleted: { $ne: true } });

  const totalActiveUsersPromise = User.countDocuments({
    isActive: IsActive.ACTIVE,
    isDeleted: { $ne: true },
  });
  const totalInactiveUsersPromise = User.countDocuments({
    isActive: IsActive.INACTIVE,
    isDeleted: { $ne: true },
  });
  const totalBlockedUsersPromise = User.countDocuments({
    isActive: IsActive.BLOCKED,
    isDeleted: { $ne: true },
  });

  const newUsersInLastSevenDaysPromise = User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
    isDeleted: { $ne: true },
  });

  const newUsersInLastThirtyDaysPromise = User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
    isDeleted: { $ne: true },
  });

  const usersByRolePromise = User.aggregate([
    // stage -1: Grouping users by role and count total users in each role
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLastSevenDays,
    newUsersInLastThirtyDays,
    usersByRole,
  ] = await Promise.all([
    totalUsersPromise,
    totalActiveUsersPromise,
    totalInactiveUsersPromise,
    totalBlockedUsersPromise,
    newUsersInLastSevenDaysPromise,
    newUsersInLastThirtyDaysPromise,
    usersByRolePromise,
  ]);

  const result = {
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLastSevenDays,
    newUsersInLastThirtyDays,
    usersByRole,
  };
  try {
    await redisClient.set(CACHE_KEY, JSON.stringify(result), { EX: CACHE_TTL });
  } catch {
    // Falls through
  }
  return result;
};

const getWorkshopStats = async () => {
  const CACHE_KEY = "stats:admin:workshops";
  const CACHE_TTL = 300;
  try {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // Falls through
  }

  const totalWorkshopPromise = WorkShop.countDocuments({
    isDeleted: { $ne: true },
  });

  const toalWorkshopByLevelPromise = WorkShop.aggregate([
    // stage-1: Connect Level model - lookup stage
    {
      $lookup: {
        from: "levels",
        localField: "level",
        foreignField: "_id",
        as: "level",
      },
    },
    // stage-2: Unwind the array to object
    {
      $unwind: "$level",
    },
    // stage-3: Grouping level
    {
      $group: {
        _id: "$level.name",
        count: { $sum: 1 },
      },
    },
  ]);

  const avgWorkshopPricePromise = WorkShop.aggregate([
    // stage-1: Group the price, do sum, and average the $sum
    {
      $group: {
        _id: null,
        avgPrice: { $avg: "$price" },
      },
    },
  ]);

  const totalWorkshopByCategoryPromise = WorkShop.aggregate([
    // stage-1: Connect category model - lookup stage
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    // stage-2: Unwind the array to object
    {
      $unwind: "$category",
    },
    // stage-3: Grouping category
    {
      $group: {
        _id: "$category.name",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalHighestEnrolledWorkshopPromise = Enrollment.aggregate([
    // stage -1 : Group the workshop
    {
      $group: {
        _id: "$workshop",
        enrollmentCount: { $sum: 1 },
      },
    },
    // stage-2: sort the workshop
    {
      $sort: { enrollmentCount: -1 },
    },
    // stage-3: sort
    {
      $limit: 5,
    },
    // stage-4: lookup stage
    {
      $lookup: {
        from: "workshops",
        let: { workshopId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$workshopId"],
              },
            },
          },
        ],
        as: "workshop",
      },
    },
    // stage-5: unwind stages
    {
      $unwind: "$workshop",
    },
    // stage-6: project stage
    {
      $project: {
        enrollmentCount: 1,
        "workshop.title": 1,
        "workshop.slug": 1,
      },
    },
  ]);

  const [
    totalWorkshop,
    totalWorkshopByLevel,
    avgWorkshopPrice,
    totalWorkshopByCategory,
    totalHighestEnrolledWorkshop,
  ] = await Promise.all([
    totalWorkshopPromise,
    toalWorkshopByLevelPromise,
    avgWorkshopPricePromise,
    totalWorkshopByCategoryPromise,
    totalHighestEnrolledWorkshopPromise,
  ]);

  const result = {
    totalWorkshop,
    totalWorkshopByLevel,
    avgWorkshopPrice,
    totalWorkshopByCategory,
    totalHighestEnrolledWorkshop,
  };
  try {
    await redisClient.set(CACHE_KEY, JSON.stringify(result), { EX: CACHE_TTL });
  } catch {
    // Falls through
  }
  return result;
};

const getEnrollmentStats = async () => {
  const CACHE_KEY = "stats:admin:enrollments";
  const CACHE_TTL = 300;
  try {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // Falls through
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalEnrollmentPromise = Enrollment.countDocuments({
    isDeleted: { $ne: true },
  });

  const totalEnrollmentByStatusPromise = Enrollment.aggregate([
    // stage-1: group stage
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const enrollmentsPerWorkshopPromise = Enrollment.aggregate([
    // stage-1: group stage
    {
      $group: {
        _id: "$workshop",
        enrollmentCount: { $sum: 1 },
      },
    },
    // stage-2: sort stage
    {
      $sort: { enrollmentCount: -1 },
    },
    // stage-3: limit stage
    {
      $limit: 10,
    },
    // stage-4: lookup stages
    {
      $lookup: {
        from: "workshops",
        localField: "_id",
        foreignField: "_id",
        as: "workshop",
      },
    },
    // stage-5: unwind stage
    {
      $unwind: "$workshop",
    },
    // stage-6: project stage
    {
      $project: {
        enrollmentCount: 1,
        _id: 1,
        "workshop.title": 1,
        "workshop.slug": 1,
      },
    },
  ]);

  const avgGuestCountPerEnrollmentPromise = Enrollment.aggregate([
    // stage-1: group stage
    {
      $group: {
        _id: null,
        avgStudentCount: { $avg: "$studentCount" },
      },
    },
  ]);

  const enrollmentsLastSevenDaysPromise = Enrollment.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
    isDeleted: { $ne: true },
  });

  const enrollmentsLastThirtyDaysPromise = Enrollment.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
    isDeleted: { $ne: true },
  });

  const totalEnrollmentByUniqueUsersPromise = Enrollment.aggregate([
    { $group: { _id: "$user" } },
    { $count: "uniqueUsers" },
  ]).then((res) => (res.length > 0 ? res[0].uniqueUsers : 0));

  const [
    totalEnrollment,
    totalEnrollmentByStatus,
    enrollmentsPerWorkshop,
    avgGuestCountPerEnrollment,
    enrollmentsLastSevenDays,
    enrollmentsLastThirtyDays,
    totalEnrollmentByUniqueUsers,
  ] = await Promise.all([
    totalEnrollmentPromise,
    totalEnrollmentByStatusPromise,
    enrollmentsPerWorkshopPromise,
    avgGuestCountPerEnrollmentPromise,
    enrollmentsLastSevenDaysPromise,
    enrollmentsLastThirtyDaysPromise,
    totalEnrollmentByUniqueUsersPromise,
  ]);

  const result = {
    totalEnrollment,
    totalEnrollmentByStatus,
    enrollmentsPerWorkshop,
    avgGuestCountPerEnrollment,
    enrollmentsLastSevenDays,
    enrollmentsLastThirtyDays,
    totalEnrollmentByUniqueUsers,
  };
  try {
    await redisClient.set(CACHE_KEY, JSON.stringify(result), { EX: CACHE_TTL });
  } catch {
    // Falls through
  }
  return result;
};

const getPaymentStats = async () => {
  const CACHE_KEY = "stats:admin:payments";
  const CACHE_TTL = 300;
  try {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // Falls through
  }

  const totalPaymentPromise = Payment.countDocuments();

  const totalPaymentByStatusPromise = Payment.aggregate([
    // stage-1: group stage
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalRevenuePromise = Payment.aggregate([
    // stage-1: match stage
    {
      $match: {
        status: PAYMENT_STATUS.PAID,
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
      },
    },
  ]);

  const avgPaymentAmountPromise = Payment.aggregate([
    // stage-1: group stages
    {
      $group: {
        _id: null,
        avgPaymentAmount: { $avg: "$amount" },
      },
    },
  ]);

  const paymentGatewayDataPromise = Payment.aggregate([
    // stage-1: group stage
    {
      $group: {
        _id: { ifNull: ["$paymentGatewayData.status", "UNKNOWN"] },
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalPayment,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount,
    paymentGatewayData,
  ] = await Promise.all([
    totalPaymentPromise,
    totalPaymentByStatusPromise,
    totalRevenuePromise,
    avgPaymentAmountPromise,
    paymentGatewayDataPromise,
  ]);

  const result = {
    totalPayment,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount,
    paymentGatewayData,
  };
  try {
    await redisClient.set(CACHE_KEY, JSON.stringify(result), { EX: CACHE_TTL });
  } catch {
    // Falls through
  }
  return result;
};

const StatsService = {
  getUsersStats,
  getWorkshopStats,
  getEnrollmentStats,
  getPaymentStats,
};

export default StatsService;
