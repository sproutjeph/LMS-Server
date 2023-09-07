import express from "express";
import {
  activateUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller";

const router = express.Router();

router.post("/registration", registerUser);
router.post("/activate-user", activateUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

export default router;
