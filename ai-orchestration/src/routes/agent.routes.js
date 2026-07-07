import { Router } from "express"
import { agent } from "../agents/code.agent.js"

const agentRouter = Router()

agentRouter.post("/invoke", async (req, res) => {
    try {
        const { message } = req.body;

        const response = await agent.invoke({
            role: "user",
            content: message
        });
        res.status(200).json(response);
    } catch (error) {
        console.log("Error in invoking agent ", error)
        res.status(500).json({ error: "Failed to invoke agent" })

    }
})

export default agentRouter