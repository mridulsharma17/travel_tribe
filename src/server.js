import dotenv from 'dotenv';
import app from './app.js';

// Load environment variables from .env file
dotenv.config();

// Verify that environment variables are loaded correctly at startup
console.log('EMAIL_USER:', process.env.EMAIL_USER && process.env.EMAIL_USER.trim() !== '' ? 'Present' : 'Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim() !== '' ? 'Present' : 'Missing');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim() !== '' ? 'Present' : 'Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Saathi OTP Backend listening on port ${PORT}`);
  console.log(` Current Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);
});

// Gracefully handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
  console.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Gracefully handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down immediately...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Handle container/platform termination signals (SIGTERM)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down server gracefully...');
  server.close(() => {
    console.log('Process terminated safely.');
  });
});
