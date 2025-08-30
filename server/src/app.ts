import express from "express";
import path from "path";
import route from "./router";
import { 
  errorHandler, 
  notFoundHandler, 
  requestLogger, 
  securityHeaders, 
  simpleRateLimit 
} from "./middleware";

const app = express();

// Security and logging middleware
app.use(securityHeaders);
app.use(requestLogger);

// Rate limiting - 100 requests per 15 minutes per IP
app.use(simpleRateLimit(100, 15));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/test', express.static(path.join(__dirname, '../public')));

// Add middleware for parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use routes
app.use("/api", route);

// Global error handling (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
