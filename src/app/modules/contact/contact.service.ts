import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError.js";
import QueryBuilder from "../../utils/queryBuilder.js";
import { IContact } from "./contact.interface.js";
import Contact from "./contact.model.js";

const contactSearchableFields = ["name", "email", "subject", "message"];

const createContact = async (payload: Partial<IContact>) => {
  const contact = await Contact.create(payload);
  return contact;
};

const getAllContacts = async (query: Record<string, string>) => {
  const baseQuery = Contact.find({ isDeleted: { $ne: true } });
  const queryBuilder = new QueryBuilder(baseQuery, query);

  const contactsData = queryBuilder
    .search(contactSearchableFields)
    .filter(["isRead"])
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    contactsData.build(),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
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
  const contact = await Contact.findByIdAndUpdate(
    contactId,
    { isDeleted: true, deletedAt: new Date() },
    { returnDocument: "after", runValidators: true },
  );
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
