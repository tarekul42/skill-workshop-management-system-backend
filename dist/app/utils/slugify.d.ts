import { Model } from "mongoose";
/**
 * Generates a unique slug for a given Mongoose model.
 *
 * @param model - The Mongoose model to check for uniqueness.
 * @param baseTitle - The base title to generate the slug from.
 * @param excludeId - Optional ID to exclude from the uniqueness check (useful for updates).
 * @returns A unique slug string.
 */
export declare const generateUniqueSlug: <T>(model: Model<T>, baseTitle: string, excludeId?: string) => Promise<string>;
