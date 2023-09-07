import { Response } from "express";
import { IUser } from "../model/user.model";
import { redis } from "./redis";
import {
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
} from "../config/server.config";

interface ITokenOption {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accesToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();
  // upload session to redis
  redis.set(user._id, JSON.stringify(user) as any);

  // parse env variables to integrate with fallback values
  const accessTokenExpire = parseInt(ACCESS_TOKEN_EXPIRE || "300", 10);
  const refreshTokenExpire = parseInt(REFRESH_TOKEN_EXPIRE || "1200", 10);

  //options for cookies
  const accessTokenOptions: ITokenOption = {
    expires: new Date(Date.now() * accessTokenExpire * 1000),
    maxAge: accessTokenExpire * 1000,
    httpOnly: true,
    sameSite: "lax",
  };
  const refreshTokenOptions: ITokenOption = {
    expires: new Date(Date.now() * refreshTokenExpire * 1000),
    maxAge: refreshTokenExpire * 1000,
    httpOnly: true,
    sameSite: "lax",
  };

  // only set secure to true in prod
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accesToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accesToken,
  });
};
