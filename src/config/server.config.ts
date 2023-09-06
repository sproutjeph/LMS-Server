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
