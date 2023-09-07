import { Request } from "express";
import { IUser } from "../src/model/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
