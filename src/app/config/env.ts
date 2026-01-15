import dotenv from "dotenv";

dotenv.config();

interface IEnvConfig {
  PORT: string;
  NODE_ENV: string;
  DATABASE_URL: string;
  BCRYPT_SALT_ROUND: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
}

const loadEnvVariables = (): IEnvConfig => {
  const requiredEnvVariables: string[] = [
    "PORT",
    "NODE_ENV",
    "DATABASE_URL",
    "BCRYPT_SALT_ROUND",
    "JWT_ACCESS_SECRET",
    "JWT_ACCESS_EXPIRES",
  ];

  requiredEnvVariables.forEach((envVariables) => {
    if (!process.env[envVariables]) {
      throw new Error(
        `Required environment variable ${envVariables} is not defined`
      );
    }
  });

  return {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
  };
};

const envVariables: IEnvConfig = loadEnvVariables();

export default envVariables;
