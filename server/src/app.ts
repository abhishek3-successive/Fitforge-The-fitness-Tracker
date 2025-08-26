import express from "express";
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
app.use(requestLogger);
app.use(securityHeaders);

// Rate Limiter- 100 requests per 15 min per IP
app.use(simpleRateLimit(100, 15));


// Add middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use routes
app.use("/api", route);

// Error handling middleware
app.use(errorHandler);
app.use(notFoundHandler);



export default app;
