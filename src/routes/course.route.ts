import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { uploadCourse } from "../controllers/course.controller";

const router = express.Router();

router.post(
  "/create-course",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);

export default router;
