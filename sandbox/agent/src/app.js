import express from 'express'
import morgan from 'morgan';
import fs from 'fs'

const app = express()

app.use(morgan('dev'));


const WORK_DIR = '/workspace'

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Hello from the sandbox agent",
        status: "ok"
    })
})


app.get('/list-files', async (req, res) => {

    const elements = await fs.promises.readdir(WORK_DIR)

    return res.status(200).json({
        message: "elements in working directory listed successfully",
        status: "ok",
        elements
    })
})


/**
 * @route GET /read-files
 * @description Reads the content of all files requested in the query parameters and return there content in JSON format 
 * @example /read-files?files=a.txt,/src/b.txt
*/
app.get('/read-files', async (req, res) => {

    const files = req.query.files

    if(!files) {
        return res.status(400).json({
            message: "No files requested",
            status: "error"
        })
    }

    const fileList = files.split(',')


    const result = await Promise.all(fileList.map(async (file) => {

        const filePath = `${WORK_DIR}/${file}`

        try{
            const content = await fs.promises.readFile(filePath, "utf-8")
            return {
                [ filePath ] : content,

            }
        } catch (error){
            [ filePath ] = `Error reading file: ${error.message}`
        }
            
    }))


    
})


/**
 * @route PATCH /update-files
 * @description Updates the content of files specified in the requested body. The request body. The request should be the Array of JSON object each oject should have a 'file'
 *  and 'content' property. The 'file' property should be the path to the file and the 'content' property should be the content of the file.
 * 
*/

app.patch('/update-files', async (req, res) => {

    const updates = req.body.updates

    if(!updates || !Array.isArray(updates)) {
        return res.status(400).json({
            message: "No updates provided or invalid format",
            status: "error"
        })
    }

    

    

})


export default app;