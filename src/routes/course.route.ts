import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  addAnswer,
  addQuestion,
  addReply,
  addReview,
  editCourse,
  getAllCourses,
  getAllCoursesAdim,
  getCoursesByUser,
  getSingleCourse,
  uploadCourse,
} from "../controllers/course.controller";

const router = express.Router();

router.post(
  "/create-course",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);
router.put(
  "/edit-course",
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);
router.get("/get-course/:id", getSingleCourse);
router.get("/get-courses", getAllCourses);
router.get("/get-course-content/:id", isAuthenticated, getCoursesByUser);
router.put("/add-question", isAuthenticated, addQuestion);
router.put("/add-answer", isAuthenticated, addAnswer);
router.put("/add-review/:id", isAuthenticated, addReview);
router.put("/add-reply", isAuthenticated, authorizeRoles("admin"), addReply);
router.get(
  "/get-allCourses-admin",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCoursesAdim
);

export default router;
