import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  getCoursesAnalytics,
  getOrderAnalytics,
  getUserAnalytics,
} from "../controllers/analytics.controller";

const router = express.Router();

router.get(
  "/user-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserAnalytics
);
router.get(
  "/order-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getOrderAnalytics
);

router.get(
  "/courses-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getCoursesAnalytics
);

export default router;
