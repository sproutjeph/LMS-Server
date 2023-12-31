import { Request, Response, NextFunction } from "express";
import cloudinary from "cloudinary";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { BadRequestError, UnauthorizedError } from "../utils/ErrorHandler";
import {
  createCourse,
  getAllCoursesService,
} from "../../services/course.service";
import CourseModel from "../model/course.modal";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendEmail from "../utils/sendMail";
import NotificationModal from "../model/notification.modal";
import cron from "node-cron";

export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const courseId = req.params.id;

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

//get single course -- without purchasing

export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      // checked for chached data
      const isChachedExist = await redis.get(courseId);
      if (isChachedExist) {
        const course = JSON.parse(isChachedExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        // chach data
        await redis.set(courseId, JSON.stringify(course), "EX", 604800); // "EX" 604800 delete cach data after 7 days

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

//get all course -- without purchasing

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isChachedExist = await redis.get("allCourses");
      if (isChachedExist) {
        const courses = JSON.parse(isChachedExist);
        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set("allCourses", JSON.stringify(courses));

        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// get course content for valid users

export const getCoursesByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      const courseExists = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );

      if (!courseExists) {
        throw new UnauthorizedError(
          "You are not eligible to access this course"
        );
      }

      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// add quest in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, contentId, courseId }: IAddQuestionData = req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        throw new BadRequestError("Invalid content id");
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        throw new BadRequestError("Invalid content id");
      }
      // create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      // add this to our course content
      courseContent.questions.push(newQuestion);
      await NotificationModal.create({
        user: req.user?._id,
        title: "New Question Received",
        message: `You have a new question in ${courseContent.title}`,
      });

      //save the course
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// add answer in course question

interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        throw new BadRequestError("Invalid content id");
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        throw new BadRequestError("Invalid content id");
      }
      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        throw new BadRequestError("Invalid question Id");
      }
      //create a new answer
      const newAnswer: any = {
        user: req.user,
        answer,
      };

      //add this answer to our course content
      question.questionReplies?.push(newAnswer);

      await course?.save();

      if (req.user?._id === question.user._id) {
        await NotificationModal.create({
          user: req.user?._id,
          title: "New Question",
          message: `You have a new question in ${courseContent.title}`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendEmail({
            email: question.user.email,
            subject: "Question replay",
            template: "question-replay.ejs",
            data,
          });
        } catch (error: any) {
          throw new BadRequestError(`${error.message}`);
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// add review

interface IAddReviewData {
  review: string;
  courseId: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.Id;
      // check if courseId already exists in userCourseList based on _id
      const courseExists = userCourseList?.some(
        (course: any) => String(course._id) === String(courseId)
      );

      if (!courseExists) {
        throw new BadRequestError("You are not eligible to access this course");
      }

      const course = await CourseModel.findById(courseId);

      const { review, rating } = req.body as IAddReviewData;

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };
      course?.reviews.push(reviewData);

      let avg = 0;
      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });
      if (course) {
        course.ratings = avg / course.reviews.length;
      }

      await course?.save();
      const notification = {
        title: "New Review Received",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      };
      // create notification
      await NotificationModal.create(notification);

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// add reply in course review
interface IAddReplyData {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const addReply = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReplyData;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        throw new BadRequestError("Course not found");
      }

      const review = course?.reviews?.find(
        (rev: any) => String(rev._id) === String(reviewId)
      );

      if (!review) {
        throw new BadRequestError("Review not found");
      }

      const replyData: any = {
        user: req.user,
        comment,
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review.commentReplies?.push(replyData);

      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

//delete notification

cron.schedule("0 0 0 * * *", async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    const notifications = await NotificationModal.find({
      status: "read",
      createdAt: { $lt: thirtyDaysAgo },
    });

    if (notifications) {
      await NotificationModal.deleteMany(notifications);
    }
  } catch (error: any) {
    throw new BadRequestError(`${error.message}`);
  }
});

// Get all courses
export const getAllCoursesAdim = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);
// Delete course admin
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const course = CourseModel.findById({ id });
      if (!course) {
        throw new BadRequestError("course not found");
      }
      await course.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);
