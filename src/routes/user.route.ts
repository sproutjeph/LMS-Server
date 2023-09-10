import express from "express";
import {
  activateUser,
  deleteUser,
  getAllUsers,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  socailAuth,
  updateAccessToken,
  updateUserInfo,
  updateUserPassword,
  updateUserRole,
  updateUserVatar,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const router = express.Router();

router.post("/registration", registerUser);
router.post("/activate-user", activateUser);
router.post("/login", loginUser);
router.get("/logout", isAuthenticated, logoutUser);
router.get("/refresh", updateAccessToken);
router.get("/me", isAuthenticated, getUserInfo);
router.post("/socailAuth", isAuthenticated, socailAuth);
router.put("/update-user-info", isAuthenticated, updateUserInfo);
router.put("/update-password", isAuthenticated, updateUserPassword);
router.put("/update-avatar", isAuthenticated, updateUserVatar);
router.get("/get-users", isAuthenticated, authorizeRoles("admin"), getAllUsers);
router.put(
  "/update-user-role",
  isAuthenticated,
  authorizeRoles("admin"),
  updateUserRole
);
router.delete(
  "/delete-user",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteUser
);

export default router;
