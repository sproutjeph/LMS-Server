import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrdersAdim } from "../controllers/order.controller";

const router = express.Router();

router.post("/create-order", isAuthenticated, createOrder);
router.get(
  "/get-allOrder-admin",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrdersAdim
);

export default router;
