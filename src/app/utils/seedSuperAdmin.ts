import bcrypt from "bcryptjs";
import envVariables from "../config/env";
import { IAuthProvider, IUser, UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";
import logger from "./logger";

const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExists = await User.findOne({
      email: envVariables.SUPER_ADMIN_EMAIL,
    });

    if (isSuperAdminExists) {
      logger.info({ msg: "Super Admin already exists!" });
      return;
    }

    const hashedPassword = await bcrypt.hash(
      envVariables.SUPER_ADMIN_PASSWORD,
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
  } catch (err) {
    logger.error({ msg: "Error seeding super admin", err });
  }
};

export default seedSuperAdmin;
