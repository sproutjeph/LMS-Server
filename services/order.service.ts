import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../src/middleware/catchAsyncErrors";
import OrderModal from "../src/model/order.modal";

export const newOrder = CatchAsyncError(
  async (data: any, res: Response, next: NextFunction) => {
    const order = await OrderModal.create(data);

    res.status(201).json({
      success: true,
      order,
    });
  }
);

// get all orders

export const getAllOrdersService = async (res: Response) => {
  const orders = await OrderModal.find().sort({ createdAt: -1 });

  res.status(201).json({
    success: true,
    orders,
  });
};
