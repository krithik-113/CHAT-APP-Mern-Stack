import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt
        if (!token) {
            return res.status(401).json({message:"Unauthorized - No Token Provided"})
        }
        const decode_id = jwt.verify(token, process.env.JWT_SECRET);
        if (!decode_id.userId) {
            return res.status(401).json({message:"Unauthorized - Invalid Token"})
        }
        const user = await User.findById(decode_id.userId).select('-password')
        if (!user) {
             return res.status(404).json({message:"User not found"})
        }
        req.user = user 
        next()
    } catch (error) {
         console.log("Error in ProtectRoute Middleware", error.message);
         res.status(500).json({ message: "Internal Server Error" });
    }
}