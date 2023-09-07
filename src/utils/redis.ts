import { Redis } from "ioredis";
import { REDIS_URL } from "../config/server.config";

const redisClient = () => {
  if (REDIS_URL) {
    console.log("Redis connected");
    return REDIS_URL;
  }

  throw new Error("Redis not connected");
};

export const redis = new Redis(redisClient());
