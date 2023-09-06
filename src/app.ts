import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ORIGIN } from "./config/server.config";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";

const app = express();

//body parser
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors());
// app.use(
//   cors({
//     origin: ORIGIN,
//   })
// );

app.use("/api/v1", userRouter);

//testing
app.get("/api/v1/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as any;
  error.statusCode = 404;
  next(error);
});

app.use(ErrorMiddleware);
export default app;
