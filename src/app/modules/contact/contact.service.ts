import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError.js";
import { IContact } from "./contact.interface.js";
import Contact from "./contact.model.js";

const createContact = async (payload: Partial<IContact>) => {
  const contact = await Contact.create(payload);
  return contact;
};

const getAllContacts = async (query: Record<string, string>) => {
  const page = Number(query.page) || 1;
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === "true";
  }

  const [data, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Contact.countDocuments(filter),
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

const getContactById = async (contactId: string) => {
  const contact = await Contact.findById(contactId);
  if (!contact) {
    throw new AppError(StatusCodes.NOT_FOUND, "Contact message not found");
  }
  return contact;
};

const markAsRead = async (contactId: string) => {
  const contact = await Contact.findByIdAndUpdate(
    contactId,
    { isRead: true },
    { returnDocument: "after", runValidators: true },
  );
  if (!contact) {
    throw new AppError(StatusCodes.NOT_FOUND, "Contact message not found");
  }
  return contact;
};

const deleteContact = async (contactId: string) => {
  const contact = await Contact.findByIdAndDelete(contactId);
  if (!contact) {
    throw new AppError(StatusCodes.NOT_FOUND, "Contact message not found");
  }
  return null;
};

const ContactService = {
  createContact,
  deleteContact,
  getAllContacts,
  getContactById,
  markAsRead,
};

export default ContactService;
