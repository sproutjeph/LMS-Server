import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ejs from "ejs";
import { Iorder } from "../model/order.modal";
import userModel from "../model/user.model";
import { BadRequestError } from "../utils/ErrorHandler";
import CourseModel from "../model/course.modal";
import { newOrder } from "../../services/order.service";
import path from "path";
import sendEmail from "../utils/sendMail";
import NotificationModal from "../model/notification.modal";

//create order
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as Iorder;
      const user = await userModel.findById(req.user?._id);

      const courseExistInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );
      if (!courseExistInUser) {
        throw new BadRequestError("You have not purchased this course");
      }

      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new BadRequestError("Course not found");
      }

      const data: any = {
        courseId: course._id,
        user: req.user?._id,
      };

      newOrder(data, res, next);

      const mailData = {
        order: {
          _id: course._id.slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString("en-us", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );

      try {
        if (user) {
          await sendEmail({
            email: user.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        throw new BadRequestError(error.message);
      }

      user?.courses.push(course._id);

      await user?.save();
      await NotificationModal.create({
        user: user?._id,
        title: "New Order",
        message: `You have a new order ${course?.name}`,
      });

      res.status(201).json({
        success: true,
        order: course,
      });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }
);
