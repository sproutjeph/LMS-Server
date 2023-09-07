import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "./catchAsyncErrors";
import {
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ACCESS_TOKEN } from "../config/server.config";
import { redis } from "../utils/redis";

export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;

    if (!access_token) {
      throw new UnauthenticatedError("Please login ");
    }

    const decodeed = jwt.verify(
      access_token,
      ACCESS_TOKEN as string
    ) as JwtPayload;

    if (!decodeed) {
      throw new UnauthorizedError("access token is not valid");
    }

    const user = await redis.get(decodeed.id);

    if (!user) {
      throw new NotFoundError("user not found");
    }

    req.user = JSON.parse(user);

    next();
  }
);

// validate user role

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      throw new UnauthorizedError("you are not authorized");
    }
    next();
  };
};
