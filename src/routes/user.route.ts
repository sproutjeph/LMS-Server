import express from "express";
import { activateUser, registerUser } from "../controllers/user.controller";

const router = express.Router();

router.post("/registration", registerUser);
router.post("/activate-user", activateUser);

export default router;
