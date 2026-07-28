import { Router } from "express"
import { agent } from "../agents/code.agent.js"

const agentRouter = Router()

agentRouter.post("/invoke", async (req, res) => {
    try {
        const { message, projectId } = req.body;

        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // writer function passed into tool config so tools can stream logs
        const writer = (text) => {
            console.log("[Tool Log]", text);
            res.write(`data: ${JSON.stringify({ type: "log", message: text })}\n\n`);
        };

        const stream = await agent.stream(
            {
                messages: [{
                    role: "user",
                    content: message
                }],
            },
            {
                configurable: { projectId },
                writer,
            }
        );

        for await (const chunk of stream) {
            // Final AI message chunk
            if (chunk?.agent?.messages?.length) {
                const lastMsg = chunk.agent.messages[chunk.agent.messages.length - 1];
                if (lastMsg?.content) {
                    res.write(`data: ${JSON.stringify({ type: "response", message: lastMsg.content })}\n\n`);
                }
            }
        }

        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();

    } catch (error) {
        console.log("Error in invoking agent ", error)
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to invoke agent" })
        } else {
            res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
            res.end();
        }
    }
})

export default agentRouter