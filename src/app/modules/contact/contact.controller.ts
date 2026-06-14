import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { parseStringParam } from "../../utils/parseParams.js";
import sendResponse from "../../utils/sendResponse.js";
import ContactService from "./contact.service.js";

const createContact = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.createContact(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.getAllContacts(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Contact messages fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getContactById = catchAsync(async (req: Request, res: Response) => {
  const contactId = parseStringParam(req.params.contactId, "contactId");
  const result = await ContactService.getContactById(contactId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Contact message fetched successfully",
    data: result,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const contactId = parseStringParam(req.params.contactId, "contactId");
  const result = await ContactService.markAsRead(contactId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Message marked as read",
    data: result,
  });
});

const deleteContact = catchAsync(async (req: Request, res: Response) => {
  const contactId = parseStringParam(req.params.contactId, "contactId");
  await ContactService.deleteContact(contactId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Message deleted successfully",
    data: null,
  });
});

const ContactController = {
  createContact,
  deleteContact,
  getAllContacts,
  getContactById,
  markAsRead,
};

export default ContactController;
