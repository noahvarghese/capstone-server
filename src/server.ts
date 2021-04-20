import cors from "cors";
import express from "express";

(async () => {
  const app = express();

  app.disable("x-powered-by");

  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  app.use(cors({ origin: "*", credentials: true }));

  app.use("/", (_, res) => {
    res.send("HELLO");
  });

  app.listen(3001, () => {
    console.log("SERVER STARTED");
  });
})();
