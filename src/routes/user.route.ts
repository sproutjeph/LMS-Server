import express from "express";
import {
  activateUser,
  loginUser,
  registerUser,
} from "../controllers/user.controller";

const router = express.Router();

router.post("/registration", registerUser);
router.post("/activate-user", activateUser);
router.post("/login", loginUser);

export default router;
