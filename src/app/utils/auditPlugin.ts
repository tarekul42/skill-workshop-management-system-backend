import { Query, Schema, Types } from "mongoose";
import { AuditAction } from "../modules/audit/audit.interface";
import AuditLog from "../modules/audit/audit.model";
import { getAuditContext } from "./auditContext";
import logger from "./logger";

/**
 * Sanitize document data for audit logging.
 * Removes sensitive fields like passwords.
 */
const sanitize = (data: Record<string, unknown>): Record<string, unknown> => {
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
const writeAuditLog = async (
  action: AuditAction,
  collectionName: string,
  documentId: Types.ObjectId | string,
  changes: Record<string, unknown>,
) => {
  try {
    const ctx = getAuditContext();

    await AuditLog.create({
      action,
      collectionName,
      documentId:
        typeof documentId === "string"
          ? new Types.ObjectId(documentId)
          : documentId,
      performedBy: ctx?.userId ? new Types.ObjectId(ctx.userId) : null,
      changes: sanitize(changes),
      ipAddress: ctx?.ipAddress ?? null,
      userAgent: ctx?.userAgent ?? null,
    });
  } catch (err) {
    logger.error(
      { err, action, collectionName, documentId },
      "Failed to write audit log",
    );
  }
};

/**
 * Mongoose plugin that automatically logs CREATE, UPDATE, and DELETE operations
 * to the AuditLog collection.
 */
const auditPlugin = (schema: Schema) => {
  // ──── CREATE ────
  schema.post("save", async function (doc) {
    if (doc.isNew !== false && doc.$isNew !== false) {
      // $isNew is already false post-save, so we track it via wasNew
    }
    // post-save receives the saved doc; for new docs we log CREATE
    // We use a flag set in pre-save to distinguish create vs update-via-save
  });

  schema.pre("save", function () {
    // Tag documents so post-save knows if this was a create
    (this as Record<string, unknown>).$wasNew = this.isNew;
  });

  schema.post("save", async function (doc) {
    const wasNew = (doc as Record<string, unknown>).$wasNew;
    const action = wasNew ? AuditAction.CREATE : AuditAction.UPDATE;
    const collectionName =
      (doc.constructor as { modelName?: string }).modelName ??
      doc.collection?.name ??
      "Unknown";

    const changes =
      action === AuditAction.CREATE
        ? doc.toObject()
        : Object.fromEntries(
            (
              doc as Record<string, unknown> & {
                modifiedPaths: () => string[];
                get: (p: string) => unknown;
              }
            )
              .modifiedPaths()
              .map((p: string) => [
                p,
                (
                  doc as Record<string, unknown> & {
                    get: (p: string) => unknown;
                  }
                ).get(p),
              ]),
          );

    await writeAuditLog(
      action,
      collectionName,
      doc._id as Types.ObjectId,
      changes,
    );
  });

  // ──── UPDATE (query-level) ────
  const updateHooks = ["findOneAndUpdate", "updateOne", "updateMany"] as const;

  for (const method of updateHooks) {
    schema.post(method, async function (this: Query<unknown, unknown>, result) {
      try {
        const collectionName =
          (this.model as { modelName?: string }).modelName ?? "Unknown";
        const update = this.getUpdate() as Record<string, unknown> | null;
        if (!update) return;

        // Extract meaningful changes from $set or top-level fields
        const changes: Record<string, unknown> = {};
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

        // Determine documentId
        const query = this.getQuery();
        const docId = query._id ?? (result as Record<string, unknown>)?._id;
        if (!docId) return;

        await writeAuditLog(
          AuditAction.UPDATE,
          collectionName,
          docId as Types.ObjectId,
          changes,
        );
      } catch (err) {
        logger.error({ err }, "Audit plugin: update hook error");
      }
    });
  }

  // ──── DELETE ────
  schema.post(
    "findOneAndDelete",
    async function (this: Query<unknown, unknown>, doc) {
      try {
        if (!doc) return;
        const collectionName =
          (this.model as { modelName?: string }).modelName ?? "Unknown";
        const deletedDoc = doc as Record<string, unknown> & {
          toObject?: () => Record<string, unknown>;
        };
        const changes = deletedDoc.toObject
          ? deletedDoc.toObject()
          : { ...deletedDoc };
        const docId = (doc as Record<string, unknown>)._id;
        if (!docId) return;

        await writeAuditLog(
          AuditAction.DELETE,
          collectionName,
          docId as Types.ObjectId,
          changes,
        );
      } catch (err) {
        logger.error({ err }, "Audit plugin: delete hook error");
      }
    },
  );
};

export default auditPlugin;
