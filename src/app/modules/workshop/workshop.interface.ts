import { Types } from "mongoose";

interface ILevel {
  name: string;
}

interface IWorkshop {
  title: string;
  slug: string;
  description?: string;
  images?: string[];
  location?: string;
  price?: number;
  startDate?: Date;
  endDate?: Date;
  whatYouLearn?: string[];
  prerequisites?: string[];
  benefits?: string[];
  syllabus?: string[];
  maxSeats?: number;
  minAge?: number;
  deleteImages?: string[];
  category: Types.ObjectId;
  level: Types.ObjectId;
}

export { ILevel, IWorkshop };
