import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { logger } from './utils/logger';

// Initialize express app
const app: Express = express();
const port = Number(process.env.PORT) || 3000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes will be mounted here
import authRoutes from './routes/auth.routes';
import dataRoutes from './routes/data.routes';
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/data', dataRoutes);
// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/transactions', transactionRouter);
// app.use('/api/v1/ai', aiRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`🚀 Server is running at http://localhost:${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

export default app;
