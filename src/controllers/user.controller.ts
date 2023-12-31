import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import userModel, { IUser } from "../model/user.model";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import {
  ACCESS_TOKEN,
  ACTIVATION_SECRET,
  REFRESH_TOKEN,
} from "../config/server.config";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/sendMail";
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from "../utils/ErrorHandler";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import {
  getAllUsersService,
  getUserById,
  updateUserRoleService,
} from "../../services/user.services";
import cloudinary from "cloudinary";

interface IRegBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const emailExists = await userModel.findOne({ email });

      if (emailExists) {
        throw new BadRequestError("Email already Exist");
        // return next(new ErrorHandler(400, "Email already Exist"));
      }
      const user: IRegBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);
      console.log(activationToken.activationCode);

      const activationCode = activationToken.activationCode;
      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendEmail({
          email: user.email,
          subject: "Account Activation",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please Check Your email: ${user.email} to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        throw new BadRequestError(`${error.message}`);
        // next(new ErrorHandler(500, error.message));
      }
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);

      // next(new ErrorHandler(501, error.message));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(Math.random() * 10000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    ACTIVATION_SECRET as Secret,
    {
      expiresIn: "10m",
    }
  );
  return { token, activationCode };
};

interface IActivationRequest {
  activationToken: string;
  activationCode: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activationToken, activationCode } =
        req.body as IActivationRequest;

      type INewUser = { user: IUser; activationCode: string };

      const newUser: INewUser = jwt.verify(
        activationToken,
        ACTIVATION_SECRET as Secret
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activationCode) {
        throw new BadRequestError(`invalid activation code`);

        // return next(new ErrorHandler(404, "Invalid activation code"));
      }

      const { name, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        throw new BadRequestError(`User already exist`);
        // return next(new ErrorHandler(400, "User already exist"));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);

      // return next(new ErrorHandler(500, error.message));
    }
  }
);

// longin user
interface ILoginUser {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError(`Email and password is required`);
      }
      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        throw new UnauthenticatedError("User not found");
      }

      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        throw new BadRequestError(`invalid password`);
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id || "";
      redis.del(userId);
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      throw new UnauthenticatedError(`${error.message}`);
    }
  }
);

// update access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token;
      const decoded = jwt.verify(
        refresh_token,
        REFRESH_TOKEN as string
      ) as JwtPayload;
      const message = "could not refresh token";
      if (!decoded) {
        throw new UnauthenticatedError(message);
      }

      const session = await redis.get(decoded.id as string);
      if (!session) {
        throw new UnauthenticatedError("please login to access this resources");
      }

      const user = JSON.parse(session);
      const accessToken = jwt.sign({ id: user._id }, ACCESS_TOKEN as string, {
        expiresIn: "5m",
      });

      const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN as string, {
        expiresIn: "3d",
      });

      req.user = user;

      res.cookie("access_token", accessToken, accessTokenOptions);

      res.cookie("refresh_token", refreshToken, refreshTokenOptions);
      const redisEXday = 604800; // 7days
      await redis.set(user._id, JSON.stringify(user), "EX", redisEXday);

      res.status(200).json({
        status: "success",
        accessToken,
      });
    } catch (error: any) {
      throw new UnauthenticatedError(`${error.message}`);
    }
  }
);

export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      throw new NotFoundError(`${error.message}`);
    }
  }
);

// socail auth
interface ISocailAuthBody {
  name: string;
  email: string;
  avatar: string;
}

export const socailAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocailAuthBody;
      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({
          name,
          email,
          avatar,
        });
        sendToken(newUser, 201, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// update user info
interface IUpdataUserInfo {
  name?: string;
  email?: string;
}

export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUpdataUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (email && user) {
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
          throw new BadRequestError("Email already exist");
        }

        user.email = email;
      }

      if (name && user) {
        user.name = name;
      }

      await user?.save();

      await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// update user password

interface IUpdateUserPassword {
  oldPassword: string;
  newPassword: string;
}

export const updateUserPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdateUserPassword;

      if (!oldPassword || !newPassword) {
        throw new BadRequestError("plaese enter old and new password");
      }

      const user = await userModel.findById(req.user?._id).select("+password");
      if (user?.password === undefined) {
        throw new BadRequestError("Invalid user");
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);

      if (!isPasswordMatch) {
        throw new UnauthenticatedError("Invalid old password");
      }

      user.password = newPassword;
      await user.save();

      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// update user vatar

interface IUpdateUserVatar {
  avatar: string;
}

export const updateUserVatar = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (avatar && user) {
        // if user has an vatar already call this
        if (user?.avatar?.public_id) {
          // first delete the old image
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }
      await user?.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// get all users

export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

//update user role admin

export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, role } = req.body;
      updateUserRoleService(res, id, role);
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);

// delete user admin
export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = userModel.findById({ id });
      if (!user) {
        throw new BadRequestError("user not found");
      }
      await user.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);
    }
  }
);
