import User from "../models/User.js";
import jwt from "jsonwebtoken";
import {upsertStreamUser} from "../lib/stream.js";
import user from "../models/User.js";

export async function signup(req, res) {
    const {email, password, fullName} = req.body;

    try{
        if(!email || !password || !fullName){
            return res.status(400).json({message: "Please fill all the fields"});
        }
        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await User.findOne({ email: email });
        if (existingUser){
            return res.status(400).json({message: "Email already exists, please use a different one"});
        }
        const idx = Math.floor(Math.random() * 100) + 1;
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

        const newUser = await User.create({
            email,
            password,
            fullName,
            profilePicture: randomAvatar,
        });

        try{
            await upsertStreamUser({
                id: newUser._id.toString(),
                name: newUser.fullName,
                image: newUser.profilePicture || "",
            })
            console.log(`Stream user created successfully for ${newUser.fullName}`);
        }catch (error){
            console.error("Error creating Stream user: ",error);
        }

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '30d',
        });


        res.cookie("jwt", token,{
            httpOnly: true, //prevent XSS attacks
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', //prevent CSRF attacks
            maxAge: 7*24*60*60*1000
        })

        res.status(201).json({success: true, message: "User created successfully", user: newUser});

    }catch(err){
        console.log("Error in signup controller", err);
        res.status(500).json({success: false, message: "Internal server error"});
    }
}

export async function login(req, res) {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({message: "Please fill all the fields"});
    }
    try {
        const user = await User.findOne({email});
        if (!user) {
            return res.status(401).json({message: "Invalid email or password"});
        }

        const isPasswordCorrect = await user.matchPassword(password);
        if(!isPasswordCorrect){
            return res.status(401).json({message: "Invalid email or password"});
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '30d',
        });

        res.cookie("jwt", token,{
            httpOnly: true, //prevent XSS attacks
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', //prevent CSRF attacks
            maxAge: 7*24*60*60*1000
        })

        res.status(200).json({success: true, message: "User logged in successfully", user});
    }catch(err){
        console.log("Error in login controller", err.message);
        res.status(500).json({success: false, message: "Internal server error"});

    }
}

export function logout(req, res) {
    res.clearCookie("jwt");
    res.status(200).json({success: true, message: "User logged out successfully"});
}

export async function onboard(req, res) {
    try{
        const userId = req.user._id;

        const {fullName, bio, nativeLanguage, learningLanguage, location} = req.body;

        if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location){
            return res.status(400).json({
                message: "Please fill all the fields",
                missingFields: [
                    !fullName && "fullName",
                    !bio && "bio",
                    !nativeLanguage && "nativeLanguage",
                    !learningLanguage && "learningLanguage",
                    !location && "location"
                ].filter(Boolean),
            });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, {
            ...req.body,
            isOnboarded: true,
        }, {new: true});

        if(!updatedUser){
            return res.status(404).json({message: "User not found"});
        }

        try{
            await upsertStreamUser({
                id: updatedUser._id.toString(),
                name: updatedUser.fullName,
                image: updatedUser.profilePicture || "",
            })
            console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
        }catch (streamError){
            console.log("Error updating Stream user after onboarding: ", streamError.message);
        }



        res.status(200).json({success: true, user: updatedUser});
    }catch(err){
        console.log("Error in onboard controller", err);
        res.status(500).json({success: false, message: "Internal server error"});
    }
}