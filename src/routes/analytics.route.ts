import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getUserAnalytics } from "../controllers/analytics.controller";

const router = express.Router();

router.get(
  "/user-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserAnalytics
);

export default router;
