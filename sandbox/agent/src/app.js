import express from 'express'
import morgan from 'morgan';
import fs from 'fs'
import path from 'path';

const app = express()

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const WORK_DIR = '/workspace'

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Hello from the sandbox agent",
        status: "ok"
    })
})

/**
 * @route GET /list-files
 * @description Lists all files and directories in the working directory and subdirectories. Returns a JSON object with
 * the file path relative to the working directory. exclude the directory like node_modules .git, dist, etc. 
 * 
 * @example /list-files
*/
app.get("/list-files", async (req, res) => {

    const listFile = async (dir, baseDir) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const files = [];

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(baseDir, entry.name);

            // exclude the certain directories
            if (entry.isDirectory() && ['node_modules', '.git', 'dist', '.svelte-kit'].includes(entry.name)) {
                continue;   
            }

            // recurcive call for directory 
            if (entry.isDirectory()) {
                files.push(...(await listFile(fullPath, relativePath)))
            } else {
                files.push(relativePath);
            }
        }
        return files;
    }

    try {
        const files = await listFile(WORK_DIR, '');
        return res.status(200).json({
            message: "files listed successfully",
            status: "ok",
            files
        })
    } catch (error) {
        return res.status(500).json({
            message: "Error listing files",
            status: "error",
            error: error.message
        })
    }
    
})


/**
 * @route GET /read-files
 * @description Reads the content of all files requested in the query parameters and return there content in JSON format 
 * @example /read-files?files=a.txt,/src/b.txt
*/
app.get("/read-files", async (req, res) => {

    const files = req.query.files

    if(!files) {
        return res.status(400).json({
            message: "No files requested",
            status: "error"
        })
    }

    const fileList = files.split(',')


    const result = await Promise.all(fileList.map(async (file) => {

        const filePath = path.join(WORK_DIR, file);

        try{
            const content = await fs.promises.readFile(filePath, "utf-8")
            return {
                [ filePath.replace("/workspace", "") ] : content
            }
        } catch (error){
            return { [filePath.replace("/workspace", "")]: `Error reading file: ${error.message}` }
        }
            
    }))

    res.status(200).json({
        message: "files read successfully",
        status: "ok",
        result
    })

    
})


/**
 * @route PATCH /update-files
 * @description Updates the content of files specified in the requested body. The request body. The request should container a property 'updates' 
 * with a JSON Array of objects should have a 'file' property specifying the file path (relative to the working directory) and a 'content' 
 * property specifying the new content for the file.
*/
app.patch("/update-files", async (req, res) => {

    const updates = req.body.updates

    if(!updates || !Array.isArray(updates)) {
        return res.status(400).json({
            message: "No updates provided or invalid format",
            status: "error"
        })
    }

    const result = await Promise.all(updates.map(async (update) => {
        
        const { file, content } = update

        const filePath = path.join(WORK_DIR,file);

        try{
            await fs.promises.writeFile(filePath, content, 'utf-8');

            return {
                [filePath]: "file updated successfully",
            }
        } catch (error){
            return {
                [filePath]: `Error updating file: ${error.message}`,
            }
        }

    }))

    return res.status(200).json({
        message: "files updated successfully",
        status: "ok",
        result
    })

})

/**
 * @route POST /create-files 
 * @description Create a new file with the content specified in the request body. The request body should contain a property 'files'
 * with a JSON Array of objects, each object should have a 'file' property specifying the file path (relative to the working directory)
 * and a 'content' property specifying the content for a new file
 */
app.post("/create-files", async (req, res) => {
    const files = req.body.files

    if(!files || !Array.isArray(files)) {
        return res.status(400).json({
            message: "No files provided or invalid format",
            status: "error"
        })
    } 

    const result = await Promise.all(files.map(async (fileObj) => {
        const { file, content } = fileObj
        const filePath = path.join(WORK_DIR, file)

        try{
            console.log(path.dirname(filePath),filePath);
            
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, content, 'utf-8');
            return {
                [ filePath ] : 'file created successfully'
            }
        } catch (error) {
            return {
                [ filePath ] : `Error creating file : ${error.message}`
            }
        }
    }))

    return res.status(200).json({
        message: "files created successfully",
        status: "ok",
        result
    })
})  




export default app;