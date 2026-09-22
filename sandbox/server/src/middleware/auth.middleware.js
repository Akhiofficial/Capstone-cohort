import { verifyToken } from "../utils.js";


export const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token || req.header['authorization']?.split(' ')[1]

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const decodedToken = verifyToken(token)

        if (!decodedToken) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        
        req.user = decodedToken
        
        next() 
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' })
    }
}