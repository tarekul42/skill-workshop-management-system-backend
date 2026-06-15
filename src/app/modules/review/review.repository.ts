import { ClientSession, Types } from "mongoose";
import { IReview, IReviewStats, REVIEW_STATUS } from "./review.interface.js";
import Review from "./review.model.js";

const findById = async (reviewId: string) => {
  return await Review.findOne({
    _id: new Types.ObjectId(reviewId),
  });
};

const findByUserAndWorkshop = async (userId: string, workshopId: string) => {
  return await Review.findOne({
    user: new Types.ObjectId(userId),
    workshop: new Types.ObjectId(workshopId),
  });
};

const create = async (payload: Partial<IReview>, session?: ClientSession) => {
  const [review] = await Review.create([payload], { session });
  return review;
};

const findByWorkshop = async (
  workshopId: string,
  page: number,
  limit: number,
  sort: string,
) => {
  const sortOption: Record<string, 1 | -1> =
    sort === "oldest"
      ? { createdAt: 1 }
      : sort === "highest"
        ? { rating: -1, createdAt: -1 }
        : sort === "lowest"
          ? { rating: 1, createdAt: -1 }
          : { createdAt: -1 };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Review.find({
      workshop: new Types.ObjectId(workshopId),
      status: REVIEW_STATUS.APPROVED,
    })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("user", "name picture")
      .lean(),
    Review.countDocuments({
      workshop: new Types.ObjectId(workshopId),
      status: REVIEW_STATUS.APPROVED,
    }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getStatsByWorkshop = async (
  workshopId: string,
): Promise<IReviewStats> => {
  const stats = await Review.aggregate([
    {
      $match: {
        workshop: new Types.ObjectId(workshopId),
        status: REVIEW_STATUS.APPROVED,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        rating1: {
          $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
        },
        rating2: {
          $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
        },
        rating3: {
          $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
        },
        rating4: {
          $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
        },
        rating5: {
          $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const s = stats[0];
  return {
    averageRating: Math.round((s.averageRating || 0) * 10) / 10,
    totalReviews: s.totalReviews || 0,
    distribution: {
      1: s.rating1 || 0,
      2: s.rating2 || 0,
      3: s.rating3 || 0,
      4: s.rating4 || 0,
      5: s.rating5 || 0,
    },
  };
};

const updateById = async (reviewId: string, payload: Partial<IReview>) => {
  const plainPayload = Object.entries(payload ?? {}).reduce<
    Record<string, unknown>
  >((acc, [key, value]) => {
    if (!key.startsWith("$") && !key.includes(".")) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return await Review.findOneAndUpdate(
    { _id: new Types.ObjectId(reviewId) },
    { $set: plainPayload },
    { returnDocument: "after", runValidators: true },
  ).populate("user", "name picture");
};

const deleteById = async (reviewId: string) => {
  return await Review.findOneAndDelete({
    _id: new Types.ObjectId(reviewId),
  });
};

const ReviewRepository = {
  create,
  deleteById,
  findById,
  findByUserAndWorkshop,
  findByWorkshop,
  getStatsByWorkshop,
  updateById,
};

export default ReviewRepository;
