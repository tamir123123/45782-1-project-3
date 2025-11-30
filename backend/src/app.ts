import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import path from 'path';
import authRouter from './routers/auth.router';
import vacationRouter from './routers/vacation.router';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max file size for 4K photos
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/vacations', vacationRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware for file upload errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ message: 'File size too large. Maximum size is 20MB' });
    return;
  }
  if (err.message === 'File too large') {
    res.status(400).json({ message: 'File size too large. Maximum size is 20MB' });
    return;
  }
  next(err);
});

export default app;
