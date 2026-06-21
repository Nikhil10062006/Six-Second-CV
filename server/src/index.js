import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import { connectDB } from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(error.message);
      throw error;
    });

    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on PORT ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.log(error.message || "MongoDB connection failed");
  });
