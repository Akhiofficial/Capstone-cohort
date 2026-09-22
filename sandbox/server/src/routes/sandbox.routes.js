import { Router } from 'express'
import { createPod } from '../kubernetes/pod.js'
import { createService } from '../kubernetes/service.js'
import { v7 as uuid } from 'uuid'
import { createSandboxKey } from '../config/redis.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import Project from '../models/project.model.js'

const router = Router()

router.post('/project', authMiddleware, async (req,res) => {
    const { title } = req.body

    const newProject = new Project({
        user: req.user.id,
        title

    })

    await newProject.save()

    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        project: newProject
    })
})

// list the project 
router.get('prjects', authMiddleware, async (req,res) => {

    const projects = await Project.find({user: req.user.id})

    res.status(200).json({
        success: true,
        projects,
        message: 'Project received Successfully'
    })
})

// start the sandbox api POST 
router.post("/sandbox/start", authMiddleware, async (req, res) => {

    try {
        //check if project already exist
        const projectId = req.body.projectId
        const project = await Project.findOne({ _id: projectId, user: req.user.id })

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }
 
        const sandboxId = uuid();

        await Promise.all([
            createPod(sandboxId),
            createService(sandboxId),
            createSandboxKey(sandboxId)
        ]);

        res.status(201).json({
            success: true,
            message: 'Sandbox started successfully',
            sandboxId,
            previewUrl: `http://${sandboxId}.preview.localhost`
        });
    } catch (error) {
        console.error("Error creating sandbox:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to start sandbox',
            error: error.message || error.toString(),
            details: error.response?.body || error.body
        });
    }
})


export default router