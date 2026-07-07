import express from "express";
import morgan from "morgan";
import agentRouter from "./routes/agent.routes.js";

const app = express();


app.use(express.json());
app.use(morgan("dev"));


app.get("/api/status/healthz", (req, res) => {
    res.status(200).json({ message: "AI Service is running", status: "ok" });
})

app.get("/api/ai/health", (req, res) => {
    res.status(200).json({ message: "Agent is Live" })
})

// Routes 
app.use("/api/ai", agentRouter)


export default app;