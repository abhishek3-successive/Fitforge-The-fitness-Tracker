import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    const URI = process.env.MONGODB_URI;
    
    console.log("Attempting to connect to MongoDB Atlas...");
    
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    });
    
    console.log("✅ MongoDB Atlas connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    
  }
};

export default connectDB;
