import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import userModel, { IUser } from "../model/user.model";
import jwt, { Secret } from "jsonwebtoken";
import { ACTIVATION_SECRET } from "../config/server.config";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/sendMail";
import { BadRequestError } from "../utils/ErrorHandler";

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

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
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
      });
    } catch (error: any) {
      throw new BadRequestError(`${error.message}`);

      // return next(new ErrorHandler(500, error.message));
    }
  }
);
