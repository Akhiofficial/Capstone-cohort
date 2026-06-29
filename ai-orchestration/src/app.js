import express from "express";
import morgan from "morgan";

const app = express();


app.use(express.json());
app.use(morgan("dev"));

app.get("/api/ai/health", (req, res) => {
    res.status(200).json({ message: "Agent is Live" })
})


export default app;