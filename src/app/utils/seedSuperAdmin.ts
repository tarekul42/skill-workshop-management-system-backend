import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import envVariables from "../config/env.js";
import {
  IAuthProvider,
  IUser,
  UserRole,
} from "../modules/user/user.interface.js";
import User from "../modules/user/user.model.js";
import logger from "./logger.js";

const MIN_PASSWORD_LENGTH = 12;

const COMMON_WEAK_PASSWORDS = new Set([
  "admin123",
  "password",
  "password123",
  "superadmin",
  "superadmin123",
  "admin@123",
  "admin@123456",
  "qwerty123",
  "changeme",
]);

export const isPasswordStrongEnough = (password: string): boolean => {
  if (password.length < MIN_PASSWORD_LENGTH) return false;
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) return false;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  return hasLower && hasUpper && hasDigit && hasSpecial;
};

const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExists = await User.findOne({
      email: envVariables.SUPER_ADMIN_EMAIL,
    });

    if (isSuperAdminExists) {
      logger.info({ msg: "Super Admin already exists!" });
      return;
    }

    let adminPassword = envVariables.SUPER_ADMIN_PASSWORD;

    if (!isPasswordStrongEnough(adminPassword)) {
      if (envVariables.NODE_ENV === "production") {
        throw new Error(
          `SUPER_ADMIN_PASSWORD does not meet security requirements ` +
            `(min ${MIN_PASSWORD_LENGTH} chars, upper, lower, digit, special, not a common password). ` +
            "Refusing to seed a weak super-admin in production.",
        );
      }

      adminPassword = randomBytes(18).toString("base64url");
      // Print to stderr (not through the structured logger) so the password
      // is visible in terminal output but NOT persisted to log aggregation.
      console.error(
        "\n⚠  SUPER_ADMIN_PASSWORD is weak — a strong password was generated.\n" +
          `   Email : ${envVariables.SUPER_ADMIN_EMAIL}\n` +
          `   Pass  : ${adminPassword}\n` +
          "   Store it securely. This is the only time it is shown.\n",
      );
    }

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      Number(envVariables.BCRYPT_SALT_ROUND),
    );

    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: envVariables.SUPER_ADMIN_EMAIL,
    };

    const payload: IUser = {
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN,
      email: envVariables.SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      isVerified: true,
      auths: [authProvider],
    };

    await User.create(payload);
    logger.info({ msg: "Super Admin seeded successfully" });
  } catch (err) {
    logger.error({ msg: "Error seeding super admin", err });
    throw err;
  }
};

export default seedSuperAdmin;
