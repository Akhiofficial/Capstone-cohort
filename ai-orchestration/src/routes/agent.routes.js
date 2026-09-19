import { Router } from "express"
import { agent } from "../agents/code.agent.js"

const agentRouter = Router()

agentRouter.post("/invoke", async (req, res) => {
    try {
        const { message, projectId } = req.body;

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });


        const response = await agent.stream({
            messages: [{
                role: "user",
                content: message
            }],
        }, {
            configurable: {
                projectId
            },
            streamMode: "custom"
        });

        for await (const chunk of response) {
            console.log("chunk", chunk);
            res.write(`data: ${(chunk)}\n`);
        }
        res.end();
    } catch (error) {
        console.log("Error in invoking agent ", error)
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to invoke agent" })
        } else {
            res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to invoke agent" })}\n\n`);
            res.end();
        }
    }
})

export default agentRouter