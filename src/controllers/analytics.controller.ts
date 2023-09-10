import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { generateLast12MonthData } from "../utils/analytics.generator";
import userModel from "../model/user.model";
import { BadRequestError } from "../utils/ErrorHandler";

// get user analytics -- only admin

export const getUserAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthData(userModel);

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);
