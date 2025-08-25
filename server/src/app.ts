import express from "express";
import route from "./router";

const app = express();

// Add middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use routes
app.use("/api", route);

export default app;
