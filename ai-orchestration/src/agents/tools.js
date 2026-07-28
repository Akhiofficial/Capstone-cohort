import axios from "axios";
import { tool } from "langchain";
import * as z from "zod"


export const listFiles = tool(
    async ({ }, config) => {
        try {

            const writer = config.writer

            writer("Listing files in project directory...\n")

            const response = await axios.get(`http://sandbox-service-${config.configurable.projectId}:3000/list-files`)

            writer("Files listed successfully. Files: " + response.data.files.join(", ") + "\n")

            return JSON.stringify(response.data.files);
        } catch (error) {
            console.error("Error in listFiles tool:", error.message);
            return `Error: ${error.message}`;
        }
    },
    {
        name: "list_files",
        description: `Returns a list of all file paths present in the project directory. 
                    Use this tool first to discover the project's structure before reading or modifying any files. 
                    It gives you the full inventory of available files so you can decide which ones are relevant to the current task.`,
        schema: z.object({})
    }
)

export const readFiles = tool(
    async ({ files }, config) => {
        try {

            const writer = config.writer

            writer("Reading files from project directory..." + files.map(f => f).join(",") + "\n")


            const response = await axios.get(`http://sandbox-service-${config.configurable.projectId}:3000/read-files/?files=` + (files ? files.join(",") : ""))

            writer("Files read successfully" + "\n")



            return JSON.stringify(response.data);
        } catch (error) {
            console.error("Error in readFiles tool:", error.message);
            return `Error: ${error.message}`;
        }
    },
    {
        name: "read_files",
        description: `Reads and returns the full content of one or more files from the project directory.
                Use this tool when you need to inspect the source code, configuration, or any other file content before making changes.
                Provide the exact file path(s) obtained from the list_files tool.
                Reading files before editing them is strongly recommended to avoid unintentional overwrites or regressions.`,
        schema: z.object({
            files: z.array(z.string()).optional().describe("An array of file paths relative to workspace to read"),
            path: z.string().optional().describe("Alternatively, a single file path relative to workspace to read"),
        })
    }
)

export const updateFiles = tool(
    async ({ files }, config) => {
        try {

            const writer = config.writer

            writer("Updating files in project directory..." + files.map(f => f).join(",") + "\n")

            const response = await axios.post(`http://sandbox-service-${config.configurable.projectId}:3000/create-files`, {
                files: files
            })

            writer("Files updated successfully")

            return JSON.stringify(response.data.result);
        } catch (error) {
            console.error("Error in updateFiles tool:", error.message);
            return `Error: ${error.message}`;
        }
    },
    {
        name: "update_files",
        description: `Writes or overwrites content to one or more files in the project directory.
                Use this tool to apply code changes, fix bugs, add new features, or create brand-new files.
                Each entry requires the target file path and the complete new content for that file — partial updates are not supported, so always include the full file content.
                To create a new file, simply provide a path that does not yet exist; the file will be created automatically.
                Always read the existing file content with read_files before updating to ensure no existing logic is accidentally removed.`,
        schema: z.object({
            files: z.array(z.object({
                file: z.string().describe("The relative or absolute path to the file to create or update"),
                content: z.string().describe("The complete new content to write to the file — must include the entire file, not just the changed portion")
            })).describe("An array of file update objects, each specifying a file path and its full updated content")
        })
    }
)
