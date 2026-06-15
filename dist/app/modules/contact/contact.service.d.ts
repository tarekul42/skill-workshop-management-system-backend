import { IContact } from "./contact.interface.js";
declare const ContactService: {
    createContact: (payload: Partial<IContact>) => Promise<import("mongoose").Document<unknown, {}, IContact, {}, import("mongoose").DefaultSchemaOptions> & IContact & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    deleteContact: (contactId: string) => Promise<null>;
    getAllContacts: (query: Record<string, string>) => Promise<{
        data: (IContact & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPage: number;
        };
    }>;
    getContactById: (contactId: string) => Promise<import("mongoose").Document<unknown, {}, IContact, {}, import("mongoose").DefaultSchemaOptions> & IContact & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    markAsRead: (contactId: string) => Promise<import("mongoose").Document<unknown, {}, IContact, {}, import("mongoose").DefaultSchemaOptions> & IContact & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
};
export default ContactService;
