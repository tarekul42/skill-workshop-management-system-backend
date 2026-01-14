import dotenv from "dotenv";

dotenv.config();

interface IEnvConfig {
  PORT: string;
  NODE_ENV: string;
  DATABASE_URL: string;
  BCRYPT_SALT_ROUND: string;
}

const loadEnvVariables = (): IEnvConfig => {
  const requiredEnvVariables: string[] = [
    "PORT",
    "NODE_ENV",
    "DATABASE_URL",
    "BCRYPT_SALT_ROUND",
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
  };
};

const envVariables: IEnvConfig = loadEnvVariables();

export default envVariables;
