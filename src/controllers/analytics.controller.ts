import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { generateLast12MonthData } from "../utils/analytics.generator";
import userModel from "../model/user.model";
import { BadRequestError } from "../utils/ErrorHandler";
import CourseModel from "../model/course.modal";
import OrderModal from "../model/order.modal";

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

// get courses analytics -- only admin

export const getCoursesAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthData(CourseModel);

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// get order analytics -- only admin

export const getOrderAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthData(OrderModal);

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);
