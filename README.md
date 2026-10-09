# Saathi OTP Backend Service

A secure, production-ready OTP (One-Time Password) verification service for the **Saathi** Android application, built with Node.js, Express, and Brevo (formerly Sendinblue).

---

## Features

- **Secure OTP Generation**: Uses cryptographically secure random integers (`crypto.randomInt`).
- **Brevo Email Integration**: Sends beautifully styled, mobile-responsive HTML emails via Brevo REST API or Brevo SMTP relay.
- **Brute Force Protection**: Limits maximum OTP verification attempts to 5 per session.
- **Auto Expiration**: OTPs automatically expire after a configurable duration (default: 5 minutes).
- **IP Rate Limiting**: Built-in rate limiting on sending (`5 requests / 10 mins`) and verifying (`20 requests / 10 mins`) to prevent abuse and brute force.
- **Security Essentials**: Configured with CORS, Helmet headers, and reverse proxy trust settings (`trust proxy`) for cloud deployment environments.
- **Seamless Local Development**: Automatically falls back to console-logging OTPs if Brevo credentials are not configured.
- **Production-Ready**: Configured for instant deployment on Render or Railway.

---

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Email Service**: Brevo API / Brevo SMTP (Nodemailer)
- **Security**: Helmet, CORS, Express Rate Limit
- **Logging**: Morgan
- **Development**: Nodemon

---

## File Structure

```text
saathi-backend/
├── src/
│   ├── routes/
│   │     otpRoutes.js      # API routes with route-specific rate limits
│   ├── controllers/
│   │     otpController.js  # Controller logic (send & verify validations)
│   ├── services/
│   │     emailService.js   # HTML email dispatch & dev mock fallback
│   ├── utils/
│   │     otpGenerator.js   # Cryptographically secure 6-digit OTP generator
│   │     otpStore.js       # In-memory store (Map wrapper, swappable)
│   ├── middleware/
│   │     errorHandler.js   # Global JSON error handling
│   ├── app.js              # Express app middleware registration
│   └── server.js           # Server startup and exception handlers
├── .env                    # Environment configurations (ignored by git)
├── .gitignore              # Standard git exclusion patterns
├── package.json            # Scripts and dependencies
└── README.md               # Setup & documentation
```

---

## Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js** (v18+) installed.

### 2. Install Dependencies
Clone/navigate to the folder and run:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3000

# Option 1: Brevo REST API Key (Recommended)
BREVO_API_KEY=your_brevo_api_key_here

# Option 2: Brevo SMTP Credentials
BREVO_USER=your_brevo_account_email@example.com
BREVO_PASS=your_brevo_smtp_key

# The sender display identity (must be verified in Brevo)
EMAIL_FROM=Saathi <mridulsharma1712006@gmail.com>

# Time (in minutes) before an OTP expires
OTP_EXPIRY_MINUTES=5
```

---

## Running the Application

### Development Mode (with Nodemon auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

---

## API Endpoints

### 1. Health Check
Checks if the service is active and healthy.

- **Method**: `GET`
- **Route**: `/health`
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Saathi OTP Service is active and healthy.",
    "timestamp": "2026-08-03T14:30:00.000Z"
  }
  ```

---

### 2. Request OTP
Generates and sends a new OTP verification code to the specified email. Overwrites any previous OTP code issued to this email.

- **Method**: `POST`
- **Route**: `/api/send-otp`
- **Body Parameters**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Sample Request (cURL)**:
  ```bash
  curl -X POST http://localhost:3000/api/send-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com"}'
  ```
- **Successful Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "OTP sent successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Email missing or invalid format):
    ```json
    {
      "success": false,
      "message": "Invalid email address format"
    }
    ```
  - `429 Too Many Requests` (Rate limit exceeded):
    ```json
    {
      "success": false,
      "message": "Too many OTP requests from this IP. Please try again after 10 minutes."
    }
    ```

---

### 3. Verify OTP
Verifies the provided OTP code against the record in the store. Validates that the record exists, the code is correct, the code has not expired, and less than 5 failed attempts have occurred.

- **Method**: `POST`
- **Route**: `/api/verify-otp`
- **Body Parameters**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Sample Request (cURL)**:
  ```bash
  curl -X POST http://localhost:3000/api/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com", "otp":"123456"}'
  ```
- **Successful Response (`200 OK`)**:
  ```json
  {
    "success": true
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Expired OTP):
    ```json
    {
      "success": false,
      "message": "OTP has expired. Please request a new OTP."
    }
    ```
  - `400 Bad Request` (Incorrect OTP, returns attempts remaining):
    ```json
    {
      "success": false,
      "message": "Invalid OTP code. You have 4 attempts remaining."
    }
    ```
  - `400 Bad Request` (Exceeded 5 incorrect attempts, locks record):
    ```json
    {
      "success": false,
      "message": "Maximum verification attempts exceeded. Please request a new OTP."
    }
    ```

---

## Deployment Guide

This repository is pre-configured to be deployed out-of-the-box without code changes.

### 1. Render Deployment
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository containing this project.
3. Configure the following properties:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under **Advanced**, add Environment Variables:
   - `PORT`: `3000` (Render will override or map this automatically)
   - `NODE_ENV`: `production`
   - `BREVO_API_KEY`: *(Your Brevo API Key)*
   - `EMAIL_FROM`: `Saathi <mridulsharma1712006@gmail.com>`
   - `OTP_EXPIRY_MINUTES`: `5`
5. Click **Deploy Web Service**.

### 2. Railway Deployment
1. Create a new Project on [Railway](https://railway.app).
2. Choose **Deploy from GitHub repo** and select this repo.
3. Railway automatically detects the `package.json` file and configures the build setup.
4. Go to **Variables** and add:
   - `BREVO_API_KEY` (or `BREVO_USER` & `BREVO_PASS`)
   - `EMAIL_FROM`
   - `OTP_EXPIRY_MINUTES`
   - `NODE_ENV`: `production`
5. Railway will automatically deploy the service using the default start command `npm start`.

---

## Security Best Practices Implemented

1. **Brute Force Defense**: Limit of 5 verification failures per email before the OTP is invalidated.
2. **IP Limiter**: Limits route spamming via `express-rate-limit`.
3. **Data Sanitization**: Auto-trimming/lowercasing of email requests, limiting body payloads to `10kb`.
4. **Header Protection**: Uses `helmet` to hide vulnerable headers (`X-Powered-By`) and set secure HTTP standards.
5. **Reverse Proxy Trust**: Uses `app.set("trust proxy", 1)` to handle rate limiting headers correctly behind Render/Railway proxy loads.
6. **No Exposure**: Secret credentials are read strictly from the process environment (`.env`). The generated OTP is **never** sent back in any HTTP API response.
7. **Instant Clean Up**: Verification codes are immediately deleted from storage upon successful verification.

"# travel_tribe" 
