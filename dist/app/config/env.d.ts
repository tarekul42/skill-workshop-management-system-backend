interface IEnvConfig {
    PORT: string;
    NODE_ENV: string;
    DATABASE_URL: string;
    BCRYPT_SALT_ROUND: number;
    JWT_ACCESS_SECRET: string;
    JWT_ACCESS_EXPIRES: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES: string;
    SUPER_ADMIN_EMAIL: string;
    SUPER_ADMIN_PASSWORD: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_CALLBACK_URL: string;
    EXPRESS_SESSION_SECRET: string;
    FRONTEND_URL: string;
    BACKEND_URL: {
        BACKEND_DEV_URL: string;
        BACKEND_PROD_URL: string;
    };
    SSL: {
        SSL_STORE_ID: string;
        SSL_STORE_PASS: string;
        SSL_PAYMENT_API: string;
        SSL_VALIDATION_API: string;
        SSL_IPN_URL: string;
        SSL_SUCCESS_BACKEND_URL: string;
        SSL_FAIL_BACKEND_URL: string;
        SSL_CANCEL_BACKEND_URL: string;
        SSL_SUCCESS_FRONTEND_URL: string;
        SSL_FAIL_FRONTEND_URL: string;
        SSL_CANCEL_FRONTEND_URL: string;
    };
    CLOUDINARY: {
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_API_SECRET: string;
    };
    EMAIL_SENDER: {
        SMTP_USER: string;
        SMTP_PASS: string;
        SMTP_PORT: string;
        SMTP_HOST: string;
        SMTP_FROM: string;
    };
    REDIS: {
        REDIS_HOST: string;
        REDIS_PORT: string;
        REDIS_USERNAME: string;
        REDIS_PASSWORD: string;
    };
    CSRF_SECRET: string;
    RESET_PASSWORD_SECRET: string;
    METRICS_API_KEY: string;
}
declare const envVariables: IEnvConfig;
export default envVariables;
