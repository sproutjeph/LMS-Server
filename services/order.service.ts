import { NextFunction } from "express";
import { CatchAsyncError } from "../src/middleware/catchAsyncErrors";
import OrderModal from "../src/model/order.modal";

export const newOrder = CatchAsyncError(
  async (data: any, next: NextFunction) => {
    const order = await OrderModal.create(data);

    next(order);
  }
);
