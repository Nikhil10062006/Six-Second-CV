import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./.env",
});

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
