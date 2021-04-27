import cors from "cors";
import express from "express";

const setupServer = async (): Promise<void> => {
    const app = express();

    app.disable("x-powered-by");

    app.use(express.json());

    app.use(express.urlencoded({ extended: true }));

    app.use(cors({ origin: "*", credentials: true }));

    app.use("/", (_, res) => {
        res.send("HELLO");
    });

    app.listen(8080, () => {
        console.log("SERVER STARTED ON PORT 8080");
    });
};

export default setupServer;
