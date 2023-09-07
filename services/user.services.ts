import { Response } from "express";
// get user by id

import userModel from "../src/model/user.model";

export const getUserById = async (id: string, res: Response) => {
  const user = await userModel.findById(id);

  res.status(201).json({
    success: true,
    user,
  });
};
