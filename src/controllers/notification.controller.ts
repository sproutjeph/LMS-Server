import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { BadRequestError } from "../utils/ErrorHandler";
import NotificationModal from "../model/notification.modal";

// get all notification only for admin
export const getNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModal.find().sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// update notification status --only for admin

export const updateNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const notification = await NotificationModal.findById(id);
      if (!notification) {
        throw new BadRequestError("Notification not found");
      } else {
        notification.status
          ? (notification.status = "read")
          : notification.status;
      }
      await notification.save();
      const notifications = await NotificationModal.find().sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);
