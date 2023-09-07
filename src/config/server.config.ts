import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 8000;

export const MONGODB_URI = process.env.MONGODB_URI as string;

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

export const ORIGIN = process.env.ORIGIN;

export const CLOUD_NAME = process.env.CLOUD_NAME;
export const CLOUD_API_KEY = process.env.CLOUD_API_KEY;
export const CLOUD_API_SECRET = process.env.CLOUD_API_SECRET;

export const REDIS_URL = process.env.REDIS_URL;

export const ACTIVATION_SECRET = process.env.ACTIVATION_SECRET;

export const SMTP_HOST = process.env.SMTP_HOST || "587";

export const SMTP_PORT = process.env.SMTP_PORT;

export const SMTP_SERVER = process.env.SMTP_SERVER;
export const SMTP_MAIL = process.env.SMTP_MAIL;
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

export const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
export const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
export const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE;
export const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE;
