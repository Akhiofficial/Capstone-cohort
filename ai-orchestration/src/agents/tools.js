import axios from "axios";
import { tool } from "langchain";
import * as z from "zod"


export const listFiles = tool(
    async () => {
        console.log("==========================")
        console.log("using the list files  tool")
        console.log("==========================")

        const response = await axios.get(`http://019f3bd4-0e2a-7722-80c4-db351319cf94.agent.localhost/list-files`)
        console.log("==========================")
        console.log("list of files ", response.data)
        console.log("==========================")

        return JSON.stringify(response.data.files);
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
    async ({ files: [] }) => {

        console.log("==========================")
        console.log("using the read files tool with files ", filesList)
        console.log("==========================")

        const response = await axios.get(`http://019f3bd4-0e2a-7722-80c4-db351319cf94.agent.localhost/read-files/?files=` + files.join(","))
        console.log("==========================")
        console.log("read files from read files tool", response.data)
        console.log("==========================")


        return JSON.stringify(response.data);

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
    async ({ files }) => {

        console.log("==========================");
        console.log("using the update files tool with files ", files);
        console.log("==========================");

        const response = await axios.patch(`http://019f3bd4-0e2a-7722-80c4-db351319cf94.agent.localhost/update-files`, {
            updates: JSON.stringify(files)
        })
        console.log("==========================");
        console.log("update", response.data);
        console.log("==========================");

        return JSON.stringify(response.data.result);
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
