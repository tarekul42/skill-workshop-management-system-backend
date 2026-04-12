import { Types } from "mongoose";
import { AuditAction } from "../modules/audit/audit.interface";
import AuditLog from "../modules/audit/audit.model";
import { getAuditContext } from "./auditContext";
import logger from "./logger";
/**
 * Sanitize document data for audit logging.
 * Removes sensitive fields like passwords.
 */
const sanitize = (data) => {
    const copy = { ...data };
    const sensitiveFields = ["password", "__v"];
    for (const field of sensitiveFields) {
        if (field in copy) {
            copy[field] = "[REDACTED]";
        }
    }
    return copy;
};
/**
 * Writes an audit log entry. Failures are logged but never thrown,
 * so they don't break the original operation.
 */
const writeAuditLog = async (action, collectionName, documentId, changes) => {
    try {
        const ctx = getAuditContext();
        await AuditLog.create({
            action,
            collectionName,
            documentId: typeof documentId === "string"
                ? new Types.ObjectId(documentId)
                : documentId,
            performedBy: ctx?.userId ? new Types.ObjectId(ctx.userId) : null,
            changes: sanitize(changes),
            ipAddress: ctx?.ipAddress ?? null,
            userAgent: ctx?.userAgent ?? null,
        });
    }
    catch (err) {
        logger.error({ err, action, collectionName, documentId }, "Failed to write audit log");
    }
};
/**
 * Mongoose plugin that automatically logs CREATE, UPDATE, and DELETE operations
 * to the AuditLog collection.
 */
const auditPlugin = (schema) => {
    // ──── CREATE ────
    schema.pre("save", function () {
        // Tag documents so post-save knows if this was a create
        this.$wasNew = this.isNew;
    });
    schema.post("save", async function (doc) {
        const wasNew = doc.$wasNew;
        const action = wasNew ? AuditAction.CREATE : AuditAction.UPDATE;
        const collectionName = doc.constructor.modelName ??
            doc.collection?.name ??
            "Unknown";
        const changes = action === AuditAction.CREATE
            ? doc.toObject()
            : Object.fromEntries(doc
                .modifiedPaths()
                .map((p) => [
                p,
                doc.get(p),
            ]));
        await writeAuditLog(action, collectionName, doc._id, changes);
    });
    // ──── UPDATE (query-level) ────
    const updateHooks = ["findOneAndUpdate", "updateOne", "updateMany"];
    for (const method of updateHooks) {
        schema.post(method, async function (result) {
            try {
                const collectionName = this.model.modelName ?? "Unknown";
                const update = this.getUpdate();
                if (!update)
                    return;
                // Extract meaningful changes from $set or top-level fields
                const changes = {};
                if (update.$set && typeof update.$set === "object") {
                    Object.assign(changes, update.$set);
                }
                // Capture top-level field updates (not operators)
                for (const key of Object.keys(update)) {
                    if (!key.startsWith("$")) {
                        changes[key] = update[key];
                    }
                }
                if (Object.keys(changes).length === 0) {
                    Object.assign(changes, update);
                }
                // Determine documentId safely (handle { $eq: id } cases)
                const query = this.getQuery();
                let docId = query._id;
                if (docId &&
                    typeof docId === "object" &&
                    !Types.ObjectId.isValid(docId)) {
                    if (docId.$eq)
                        docId = docId.$eq;
                }
                docId = docId ?? result?._id;
                if (!docId)
                    return;
                await writeAuditLog(AuditAction.UPDATE, collectionName, docId, changes);
            }
            catch (err) {
                logger.error({ err }, "Audit plugin: update hook error");
            }
        });
    }
    // ──── DELETE ────
    schema.post("findOneAndDelete", async function (doc) {
        try {
            if (!doc)
                return;
            const collectionName = this.model.modelName ?? "Unknown";
            const deletedDoc = doc;
            const changes = deletedDoc.toObject
                ? deletedDoc.toObject()
                : { ...deletedDoc };
            const docId = doc._id;
            if (!docId)
                return;
            await writeAuditLog(AuditAction.DELETE, collectionName, docId, changes);
        }
        catch (err) {
            logger.error({ err }, "Audit plugin: delete hook error");
        }
    });
};
export default auditPlugin;
