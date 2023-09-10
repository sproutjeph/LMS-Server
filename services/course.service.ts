import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../src/middleware/catchAsyncErrors";
import CourseModel from "../src/model/course.modal";

export const createCourse = CatchAsyncError(
  async (data: any, res: Response, next: NextFunction) => {
    const course = await CourseModel.create(data);

    res.status(201).json({
      success: true,
      course,
    });
  }
);

// get all courses

export const getAllCoursesService = async (res: Response) => {
  const courses = await CourseModel.find().sort({ createdAt: -1 });

  res.status(201).json({
    success: true,
    courses,
  });
};
