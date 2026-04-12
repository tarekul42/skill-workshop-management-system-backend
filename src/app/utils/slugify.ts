import { Model, Types } from "mongoose";
import logger from "./logger.js";

/**
 * Generates a unique slug for a given Mongoose model.
 *
 * @param model - The Mongoose model to check for uniqueness.
 * @param baseTitle - The base title to generate the slug from.
 * @param excludeId - Optional ID to exclude from the uniqueness check (useful for updates).
 * @returns A unique slug string.
 */
export const generateUniqueSlug = async <T>(
  model: Model<T>,
  baseTitle: string,
  excludeId?: string,
): Promise<string> => {
  const baseSlug = baseTitle
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-alphanumeric characters
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores/dashes with a single dash
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes

  let slug = baseSlug;
  let counter = 0;

  while (counter < 100) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const exists = await model.findOne(query);
    if (!exists) break;

    slug = `${baseSlug}-${++counter}`;
  }

  if (counter >= 100) {
    logger.error({
      msg: "Slug generation limit reached",
      baseSlug,
      model: model.modelName,
    });
  }

  return slug;
};
