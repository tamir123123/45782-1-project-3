import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import sequelize from './db/connection';
import { initializeSocket } from './socket';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models (don't alter tables in production)
    // await sequelize.sync({ alter: false });

    // Create HTTP server and initialize Socket.IO
    const httpServer = createServer(app);
    initializeSocket(httpServer);

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Socket.IO initialized');
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
