import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import otpRoutes from './routes/otpRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Enable trust proxy for correct rate limiting behind reverse proxies (like Render)
app.set('trust proxy', 1);

// 1. Security Middlewares
app.use(helmet());
app.use(cors());

// 2. Logging Middleware (Combined logs in production, Dev logs in development)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 3. Body Parsing Middleware (JSON parsing with size limit protection)
app.use(express.json({ limit: '10kb' }));

// 4. Base health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Saathi OTP Service is active and healthy.',
    timestamp: new Date().toISOString()
  });
});

// 5. Mount API Routes
app.use('/api', otpRoutes);

// 6. Handle Undefined Routes
app.all('*', (req, res, next) => {
  const err = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});

// 7. Global Error Handler Middleware
app.use(errorHandler);

export default app;
