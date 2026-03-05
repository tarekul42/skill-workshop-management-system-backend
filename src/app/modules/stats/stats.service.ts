import Enrollment from "../enrollment/enrollment.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import Payment from "../payment/payment.model";
import { IsActive } from "../user/user.interface";
import User from "../user/user.model";
import { WorkShop } from "../workshop/workshop.model";

const getUsersStats = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalUsersPromise = User.countDocuments();

  const totalActiveUsersPromise = User.countDocuments({
    isActive: IsActive.ACTIVE,
  });
  const totalInactiveUsersPromise = User.countDocuments({
    isActive: IsActive.INACTIVE,
  });
  const totalBlockedUsersPromise = User.countDocuments({
    isActive: IsActive.BLOCKED,
  });

  const newUsersInLastSevenDaysPromise = User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  const newUsersInLastThirtyDaysPromise = User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
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

  return {
    totalUsers,
    totalActiveUsers,
    totalInActiveUsers,
    totalBlockedUsers,
    newUsersInLastSevenDays,
    newUsersInLastThirtyDays,
    usersByRole,
  };
};

const getWorkshopStats = async () => {
  const totalWorkshopPromise = WorkShop.countDocuments();

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

  return {
    totalWorkshop,
    totalWorkshopByLevel,
    avgWorkshopPrice,
    totalWorkshopByCategory,
    totalHighestEnrolledWorkshop,
  };
};

const getEnrollmentStats = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalEnrollmentPromise = Enrollment.countDocuments();

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
  });

  const enrollmentsLastThirtyDaysPromise = Enrollment.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
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

  return {
    totalEnrollment,
    totalEnrollmentByStatus,
    enrollmentsPerWorkshop,
    avgGuestCountPerEnrollment,
    enrollmentsLastSevenDays,
    enrollmentsLastThirtyDays,
    totalEnrollmentByUniqueUsers,
  };
};

const getPaymentStats = async () => {
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

  return {
    totalPayment,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount,
    paymentGatewayData,
  };
};

const StatsService = {
  getUsersStats,
  getWorkshopStats,
  getEnrollmentStats,
  getPaymentStats,
};

export default StatsService;
