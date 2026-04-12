import crypto from "crypto";

export const getTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString("hex"); // 8 hex chars = 4 billion combinations
  return `tran_${timestamp}_${random}`;
};
