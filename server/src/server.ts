import connectDB from "./config/db";
import app from "./app";
import { startGraphQLServer } from "./graphql/server";

const PORT = process.env.PORT || 3002;

const startServers = async () => {
  try {
    await connectDB();
    
    // Start REST API server
    app.listen(PORT, () => {
      console.log(`🚀 REST API Server is running on port ${PORT}`);
    });

    // Start GraphQL server
    await startGraphQLServer();
    
  } catch (error) {
    console.error("Failed to start servers:", error);
    process.exit(1);
  }
};

startServers();