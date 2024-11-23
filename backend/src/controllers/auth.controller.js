import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { generateToken } from "../lib/utils.js";
import cloudinary from '../lib/cloudinary.js'

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({message:"All the fields are required"})
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be atleast 6 characters" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ fullName, email, password: hashedPassword });
    if (newUser) {
      const token =  generateToken(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        token,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log('Error in signup controller', error.message)
    res.status(500).json({message:"Internal Server Error"})
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body 
  try {
    if (!email || !password) {
       return res.status(400).json({ message: "All the fields are required" });
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password) 
    if (!isPasswordCorrect) {
      return res.status(400).json({message:"Invalid credentials"})
    }
     const token = generateToken(user._id, res)
    res
      .status(200)
      .json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        token,
      });
    
  } catch (error) {
     console.log("Error in signup controller", error.message);
     res.status(500).json({ message: "Internal Server Error" });
  }
};
export const logout = async (req, res) => {
  try {
    res.cookie('jwt', "", { maxAge: 0 })
    res.status(200).json({message:"Logged out successfully"})
  } catch (error) {
    console.log("Error in logout controller", error.message)
    res.status(500).json({message:"Internal Server Error"})
  }
};
;
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body 
    const userId = req.user._id

    if (!profilePic) {
      return res.status(400).json({message:"Profile pic is required"})
    }
    const uploadResponse = await cloudinary.uploader.upload(profilePic)
    const updateUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true })
    res.status(200).json(updateUser)
  } catch (error) {
    console.log("Error in update profile", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = async (req,res) => {
  try {
    const users = await User.findById(req.user._id).select('-password')
    res.status(200).json(users)
  } catch (error) {
     console.log("Error in update profile", error.message);
     res.status(500).json({ message: "Internal Server Error" });
  }
}