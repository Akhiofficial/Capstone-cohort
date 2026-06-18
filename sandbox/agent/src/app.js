import express from 'express'
import morgan from 'morgan';
import fs from 'fs'

const app = express()

app.use(morgan('dev'));


const WORK_DIR = '/workspace'

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Hello from the agent",
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

export default app;