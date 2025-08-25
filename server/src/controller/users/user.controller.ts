import User from "../../models/user";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";

export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  // if user already register then show message user is already register

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User is already registered" });
  }
  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
    console.log(error);
  }
};

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compare the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.status(200).json({ message: "Login successful" });
    } catch (error) {
        res.status(500).json({ message: "Error logging in" });

        console.log(error)
    }
};
