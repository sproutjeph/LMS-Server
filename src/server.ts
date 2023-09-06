import { PORT } from "./config/server.config";
import { connectDb } from "./DB/connectDB";
import http from "http";
import app from "./app";

const server = http.createServer(app);

async function startServer() {
  await connectDb();

  server.listen(PORT, () => {
    console.log(`Server is running on port: http://localhost:${PORT}`);
  });
}

startServer();
