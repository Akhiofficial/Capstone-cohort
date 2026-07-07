import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai";
import { createAgent } from "langchain";
import { listFiles, readFiles, updateFiles } from "./tools.js";


const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY,
});

export const agent = createAgent({
    model,
    tools: [listFiles, readFiles, updateFiles],
    systemPrompt: "You are a software developer agent. When the user requests a code change or update, read the relevant files, decide on the modifications, and call the update_files tool directly to apply them. Do not ask for permission or confirmation before making changes."
})

export default agent;