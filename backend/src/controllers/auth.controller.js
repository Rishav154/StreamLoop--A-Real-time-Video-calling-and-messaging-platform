import User from "../models/User.js";
import * as jwt from "node/crypto.js";

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

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.cookies("jwt", token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        })

    }catch(err){
    }
}
export async function login(req, res) {
    res.send("Login route");
}
export function logout(req, res) {
    res.send("Logout route");
}
