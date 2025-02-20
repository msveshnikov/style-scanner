````markdown
# Documentation for `server/index.js`

## Overview

`server/index.js` is the main entry point for the backend server application. It's built using
Node.js with Express.js and serves as the central hub for handling API requests, managing routing,
and integrating various functionalities like database interactions (MongoDB via Mongoose), user
authentication, AI service integration for fashion insights, Stripe for payments, and serving static
files for the frontend application.

This file initializes the Express app, sets up middleware for request handling (CORS, JSON parsing,
logging, compression, rate limiting, metrics), connects to the MongoDB database, defines API
endpoints for user-related actions, admin functionalities, AI insight generation, feedback
collection, Stripe webhook handling, documentation serving, and sitemap generation. It also serves
the frontend application's static files.

**Project Structure Context:**

- Located in the `server` directory, indicating its role as the backend server component.
- Imports modules and configurations from other files within the `server` directory, such as:
    - `models`: Defines Mongoose schemas for data models (`User.js`, `Insight.js`, `Feedback.js`).
    - `middleware`: Contains custom middleware, including authentication (`auth.js`).
    - `user.js`: Defines user-related API routes.
    - `admin.js`: Defines admin-related API routes.
    - `aiService.js`: Handles communication with the AI service for image analysis.
- Interacts with the `public` directory for static files like `landing.html` and the `dist`
  directory (presumably built frontend application).
- Uses environment variables configured via `dotenv` for sensitive information like API keys and
  database URIs.

## Imports

```javascript
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import promBundle from 'express-prom-bundle';
import { promises as fsPromises } from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import morgan from 'morgan';
import compression from 'compression';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Insight from './models/Insight.js';
import userRoutes from './user.js';
import Feedback from './models/Feedback.js';
import { authenticateToken, authenticateTokenOptional } from './middleware/auth.js';
import adminRoutes from './admin.js';
import { analyzeFashionImage } from './aiService.js';
```
````

**Description of Imports:**

- `express`: The core framework for building the web server.
- `cors`: Middleware for enabling Cross-Origin Resource Sharing, allowing requests from different
  domains (like the frontend).
- `fs`: Node.js file system module, used for reading files (e.g., HTML files, documentation).
- `promBundle`: Middleware for collecting and exposing application metrics in Prometheus format.
- `fsPromises`: Promisified version of `fs` for asynchronous file system operations.
- `dotenv`: Module for loading environment variables from a `.env` file.
- `Stripe`: Stripe Node.js library for interacting with the Stripe payment gateway.
- `rateLimit`: Middleware for limiting the rate of incoming requests to prevent abuse.
- `mongoose`: ODM (Object Data Modeling) library for MongoDB, used to interact with the database.
- `morgan`: HTTP request logger middleware for logging requests to the console.
- `compression`: Middleware for compressing response bodies to improve performance.
- `path`: Node.js module for working with file and directory paths.
- `url`: Node.js module for URL parsing.
- `User`: Mongoose model for the User schema, defined in `./models/User.js`.
- `Insight`: Mongoose model for the Insight schema, defined in `./models/Insight.js`.
- `userRoutes`: Function to set up user-related routes, defined in `./user.js`.
- `Feedback`: Mongoose model for the Feedback schema, defined in `./models/Feedback.js`.
- `authenticateToken`, `authenticateTokenOptional`: Middleware functions for JWT authentication,
  defined in `./middleware/auth.js`.
- `adminRoutes`: Function to set up admin-related routes, defined in `./admin.js`.
- `analyzeFashionImage`: Function to call the AI service for fashion image analysis, defined in
  `./aiService.js`.

## Global Variables and Setup

```javascript
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;
app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe-webhook') {
        next();
    } else {
        express.json({ limit: '15mb' })(req, res, next);
    }
});
const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    customLabels: { model: 'No' },
    transformLabels: (labels, req) => {
        labels.model = req?.body?.model ?? 'No';
        return labels;
    }
});
app.use(metricsMiddleware);
app.use(cors());
app.use(express.static(join(__dirname, '../dist')));
app.use(morgan('dev'));
app.use(compression());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30
});
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', limiter);
}
mongoose.connect(process.env.MONGODB_URI, {});
userRoutes(app);
adminRoutes(app);
```

**Description:**

- `dotenv.config()`: Loads environment variables from a `.env` file into `process.env`. This is used
  to configure sensitive data like API keys and database URIs.
- `stripe = new Stripe(process.env.STRIPE_KEY)`: Initializes the Stripe client with the secret key
  from environment variables, allowing interaction with the Stripe API.
- `__filename = fileURLToPath(import.meta.url)` and `__dirname = dirname(__filename)`: These lines
  are used to correctly determine the current file's directory when using ES modules (`import`) in
  Node.js. `__dirname` will hold the absolute path to the `server` directory.
- `const app = express()`: Creates an instance of the Express application, which will be used to
  define routes and middleware.
- `app.set('trust proxy', 1)`: Configures Express to trust the first proxy in front of the server.
  This is often needed when deploying behind a reverse proxy like Nginx or in cloud environments to
  correctly determine the client's IP address.
- `const port = process.env.PORT || 3000`: Defines the port the server will listen on. It uses the
  `PORT` environment variable if set, otherwise defaults to 3000.
- `app.use(...)`: This section sets up various middleware functions that are executed for every
  incoming request.
    - JSON Request Body Parsing: Configures `express.json()` middleware to parse JSON request bodies
      with a limit of 15MB, except for `/api/stripe-webhook` which uses `express.raw` to handle raw
      webhook payload for signature verification.
    - `metricsMiddleware`: Integrates Prometheus metrics using `express-prom-bundle`. It tracks
      request method, path, and status code, and adds a custom label `model` based on the request
      body (useful for tracking AI model usage).
    - `cors()`: Enables CORS for all routes, allowing cross-origin requests.
    - `express.static(join(__dirname, '../dist'))`: Serves static files from the `dist` directory
      (likely the built frontend application). This makes the frontend accessible from the server.
    - `morgan('dev')`: Enables request logging in "dev" format, which logs concise output to the
      console for development purposes.
    - `compression()`: Enables response compression, reducing the size of responses sent to clients.
    - `limiter`: Creates a rate limiter using `express-rate-limit`. It limits each IP address to 30
      requests within a 15-minute window.
    - Conditional Rate Limiting: Applies the `limiter` middleware to all `/api/` routes only when
      the `NODE_ENV` environment variable is set to `production`. This is to prevent rate limiting
      during development.
    - `mongoose.connect(process.env.MONGODB_URI, {})`: Connects to the MongoDB database using the
      URI provided in the `MONGODB_URI` environment variable.
    - `userRoutes(app)` and `adminRoutes(app)`: Call functions from `./user.js` and `./admin.js` to
      set up user-related and admin-related routes on the Express application instance (`app`).

## Middleware Functions

### `checkAiLimit(req, res, next)`

```javascript
export const checkAiLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (
            user &&
            user.subscriptionStatus !== 'active' &&
            user.subscriptionStatus !== 'trialing'
        ) {
            const now = new Date();
            if (user.lastAiRequestTime) {
                const lastRequest = new Date(user.lastAiRequestTime);
                if (now.toDateString() === lastRequest.toDateString()) {
                    if (user.aiRequestCount >= 13) {
                        return res
                            .status(429)
                            .json({ error: 'Daily AI request limit reached, please upgrade' });
                    }
                    user.aiRequestCount++;
                } else {
                    user.aiRequestCount = 1;
                    user.lastAiRequestTime = now;
                }
            } else {
                user.lastAiRequestTime = now;
                user.aiRequestCount = 1;
            }
            await user.save();
        }
        next();
    } catch (err) {
        next(err);
    }
};
```

**Description:**

This middleware function is responsible for enforcing daily AI request limits for non-subscribed and
non-trialing users. It checks if a user has exceeded their daily limit of 13 AI requests.

**Parameters:**

- `req`: Express request object. It expects `req.user` to be populated by the `authenticateToken`
  middleware with user information including `id`.
- `res`: Express response object.
- `next`: The next middleware function in the chain.

**Request:**

- Expects `req.user.id` to be available (populated by `authenticateToken` middleware).

**Response:**

- **On reaching daily limit:**
    - Status Code: `429` (Too Many Requests)
    - Response Body: `{ error: 'Daily AI request limit reached, please upgrade' }`
- **On successful check or for subscribed/trialing users:**
    - Calls `next()` to proceed to the next middleware or route handler.

**Logic:**

1. **Fetch User:** Retrieves the user document from the database using `req.user.id`.
2. **Subscription Check:** Checks if the user exists and if their `subscriptionStatus` is neither
   'active' nor 'trialing'. If they are subscribed or in trial, the limit does not apply, and
   `next()` is called.
3. **Daily Limit Logic (for non-subscribed/non-trialing users):**
    - Gets the current date (`now`).
    - Checks if `user.lastAiRequestTime` exists.
        - **If it exists:** Compares the current date's string representation with the
          `lastAiRequestTime` date's string representation to check if it's the same day.
            - **Same day:** Checks if `user.aiRequestCount` is already 13 or more.
                - **Limit reached:** Returns a 429 error response.
                - **Limit not reached:** Increments `user.aiRequestCount`.
            - **Different day:** Resets `user.aiRequestCount` to 1 and updates
              `user.lastAiRequestTime` to the current time.
        - **If it doesn't exist:** Sets `user.lastAiRequestTime` to the current time and
          `user.aiRequestCount` to 1 (first request).
4. **Save User:** Saves the updated user document to the database.
5. **Call next():** Proceeds to the next middleware or route handler.
6. **Error Handling:** Catches any errors during the process and passes them to the error handling
   middleware via `next(err)`.

**Usage Example:**

This middleware is used before the `/api/generate-insight` route to enforce AI request limits for
free users.

```javascript
app.post('/api/generate-insight', authenticateToken, checkAiLimit, async (req, res) => { ... });
```

## Route Handlers

### `POST /api/generate-insight`

```javascript
app.post('/api/generate-insight', authenticateToken, checkAiLimit, async (req, res) => { ... });
```

**Description:**

This route handles requests to generate fashion insights based on an image source provided by the
user. It authenticates the user, checks their AI request limit, calls the AI service to analyze the
image, saves the insight to the database, and returns the AI service's response.

**Middleware:**

- `authenticateToken`: Ensures the request is authenticated using a JWT.
- `checkAiLimit`: Enforces daily AI request limits for non-subscribed users.

**Request Body:**

- `imageSource` (String, required): Base64 encoded image string or image URL.
- `stylePreferences` (Object, optional): User's style preferences to guide the AI analysis.

**Response:**

- **Status Code:**

    - `200` (OK): Insight generated successfully.
    - `400` (Bad Request): If `imageSource` is missing.
    - `429` (Too Many Requests): If the daily AI request limit is reached (handled by `checkAiLimit`
      middleware).
    - `500` (Internal Server Error): For any server-side errors, including errors from the AI
      service.

- **Response Body (on success - 200):**
    - Returns the JSON response from the `analyzeFashionImage` AI service. This typically includes:
        ```json
        {
            "insights": {
                "recommendations": [ ... ],
                "benefits": [ ... ],
                "outfitAnalysis": "...",
                "styleScore": "..."
            },
            // ... other AI service response data
        }
        ```
- **Response Body (on error - 400, 500):**
    - `{ error: "Error message" }`

**Usage Example:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "imageSource": "base64_encoded_image_string",
    "stylePreferences": {
      "preferredStyles": ["Minimalist", "Casual"],
      "avoidedStyles": ["Bohemian"]
    }
  }' \
  http://localhost:3000/api/generate-insight
```

### `GET /api/myinsights`

```javascript
app.get('/api/myinsights', authenticateToken, async (req, res) => { ... });
```

**Description:**

This route retrieves a list of fashion insights created by the authenticated user. It allows for
optional searching of insights based on title, recommendations, or analysis.

**Middleware:**

- `authenticateToken`: Ensures the request is authenticated using a JWT.

**Query Parameters:**

- `search` (String, optional): Search term to filter insights by title, recommendations, or
  analysis.

**Response:**

- **Status Code:**

    - `200` (OK): Insights retrieved successfully.
    - `500` (Internal Server Error): For any server-side errors.

- **Response Body (on success - 200):**
    - An array of insight objects in JSON format. Each object represents a limited view of an
      Insight document, containing:
        ```json
        [
          {
            "_id": "...",
            "title": "Fashion Insight",
            "photo": "...",
            "recommendations": [ ... ],
            "benefits": [ ... ],
            "analysis": { "outfitAnalysis": "..." },
            "styleScore": "...",
            "createdAt": "...",
            "updatedAt": "..."
          },
          // ... more insights
        ]
        ```

**Usage Example:**

- **Without search:**
    ```bash
    curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:3000/api/myinsights
    ```
- **With search:**
    ```bash
    curl -H "Authorization: Bearer <JWT_TOKEN>" "http://localhost:3000/api/myinsights?search=dress"
    ```

### `GET /api/insights/:identifier`

```javascript
app.get('/api/insights/:identifier', async (req, res) => { ... });
```

**Description:**

This route retrieves a single fashion insight based on its identifier. The identifier can be either
a MongoDB ObjectId or potentially another unique identifier (though currently only ObjectId is
handled).

**Path Parameters:**

- `identifier` (String, required): The ObjectId of the insight to retrieve.

**Response:**

- **Status Code:**

    - `200` (OK): Insight retrieved successfully.
    - `404` (Not Found): If no insight is found with the given identifier.
    - `500` (Internal Server Error): For any server-side errors.

- **Response Body (on success - 200):**
    - A single insight object in JSON format, representing the full Insight document from the
      database.
    ```json
    {
      "_id": "...",
      "title": "Fashion Insight",
      "photo": "...",
      "userId": "...",
      "recommendations": [ ... ],
      "benefits": [ ... ],
      "analysis": { "outfitAnalysis": "..." },
      "styleScore": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
    ```
- **Response Body (on error - 404):**
    - `{ error: 'Insight not found' }`

**Usage Example:**

```bash
curl http://localhost:3000/api/insights/654c5d6a7b8c9d0a1b2c3d4e
```

### `POST /api/feedback`

```javascript
app.post('/api/feedback', authenticateTokenOptional, async (req, res) => { ... });
```

**Description:**

This route allows users (both authenticated and anonymous) to submit feedback about the application.

**Middleware:**

- `authenticateTokenOptional`: Optionally authenticates the user using a JWT. If a valid token is
  provided, `req.user` will be populated. If not, the request proceeds without authentication.

**Request Body:**

- `message` (String, required): The feedback message.
- `type` (String, required): The type of feedback (e.g., 'bug', 'feature request', 'general
  feedback').

**Response:**

- **Status Code:**

    - `201` (Created): Feedback submitted successfully.
    - `500` (Internal Server Error): For any server-side errors.

- **Response Body (on success - 201):**
    - The created feedback object in JSON format.
    ```json
    {
        "_id": "...",
        "userId": "...", // May be null if feedback is anonymous
        "message": "...",
        "type": "...",
        "createdAt": "..."
    }
    ```

**Usage Example:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>"  # Optional, remove for anonymous feedback
  -d '{
    "message": "The app is great, but...",
    "type": "feature request"
  }' \
  http://localhost:3000/api/feedback
```

### `POST /api/stripe-webhook`

```javascript
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => { ... });
```

**Description:**

This route handles Stripe webhook events. It is configured to receive raw JSON data (using
`express.raw`) to allow for Stripe signature verification. It verifies the webhook signature,
processes relevant events (currently subscription updates, creations, and deletions), updates user
subscription status in the database, and sends Google Analytics events for purchase tracking.

**Middleware:**

- `express.raw({ type: 'application/json' })`: Parses the request body as raw buffer, necessary for
  Stripe webhook signature verification. **Note:** This middleware is applied specifically to this
  route and not globally because webhook payloads need to be processed raw for signature
  verification.

**Request Body:**

- Raw JSON payload sent by Stripe containing event data.

**Request Headers:**

- `stripe-signature`: Stripe signature header used for webhook verification.

**Response:**

- **Status Code:**

    - `200` (OK): Webhook received and processed successfully.
    - `400` (Bad Request): If webhook signature verification fails or other errors occur during
      processing.

- **Response Body (on success - 200):**
    - `{ received: true }`
- **Response Body (on error - 400):**
    - `Webhook Error: <Error message>`

**Logic:**

1. **Webhook Signature Verification:** Uses `stripe.webhooks.constructEventAsync` to verify the
   webhook signature using the raw request body, signature from headers, and Stripe webhook secret
   from environment variables (`process.env.STRIPE_WH_SECRET`).
2. **Event Handling:** Uses a `switch` statement to handle different Stripe event types. Currently
   handles:
    - `customer.subscription.updated`
    - `customer.subscription.created`
    - `customer.subscription.deleted`
    - For these events:
        - Extracts the `subscription` object from `event.data.object`.
        - Retrieves the customer object from Stripe using `subscription.customer`.
        - Updates the corresponding user in the database (`User.findOneAndUpdate`) based on the
          customer's email, setting `subscriptionStatus` and `subscriptionId`.
        - Sends a 'purchase' event to Google Analytics using the Measurement Protocol, including
          `subscriptionStatus` and `subscriptionId` as parameters.
3. **Unhandled Event Types:** Logs unhandled event types to the console.
4. **Error Handling:** Catches errors during webhook verification or processing and sends a 400
   error response.

**Security Note:**

Webhook signature verification is crucial for security. It ensures that the webhook events are
actually coming from Stripe and not from a malicious source. **Never skip webhook signature
verification in a production environment.**

**Usage Example:**

Stripe webhooks are triggered by events on the Stripe platform. There is no direct client-side
usage. Stripe will POST events to this endpoint when relevant events occur (e.g., subscription
updates).

### `GET /api/docs`

```javascript
app.get('/api/docs', async (req, res) => { ... });
```

**Description:**

This route serves documentation files from the `docs` directory. It allows for filtering and
searching of documentation based on category and search terms.

**Query Parameters:**

- `search` (String, optional): Search term to filter documentation by title or content.
- `category` (String, optional): Category to filter documentation by (can be 'all' or a specific
  category).

**Response:**

- **Status Code:**

    - `200` (OK): Documentation retrieved successfully.
    - `500` (Internal Server Error): For any server-side errors (e.g., file system access errors).

- **Response Body (on success - 200):**
    - An array of documentation objects in JSON format. Each object contains:
        ```json
        [
            {
                "title": "...", // Document title (filename without extension and underscores replaced with spaces)
                "category": "general", // Currently hardcoded to 'general'
                "content": "...", // Document content (HTML or text)
                "filename": "..." // Original filename
            }
            // ... more documentation objects
        ]
        ```

**Logic:**

1. **Read Documentation Files:** Reads all files from the `docs` directory using
   `fsPromises.readdir`.
2. **Process Each File:** For each file:
    - Reads the file content using `fsPromises.readFile`.
    - Extracts the title from the filename (removes extension, replaces underscores/hyphens with
      spaces).
    - Sets the category to 'general' (currently static).
    - Creates a documentation object with `title`, `category`, `content`, and `filename`.
3. **Filtering:**
    - **Category Filtering:** If `categoryQuery` is provided (and not 'all'), filters documents to
      include those whose category or filename (lowercase) includes the `categoryQuery`.
    - **Search Filtering:** If `search` is provided, filters documents to include those whose title
      or content (lowercase) includes the `search` term.
4. **Response:** Sends the filtered array of documentation objects in the response.

**Usage Example:**

- **Get all docs:**
    ```bash
    curl http://localhost:3000/api/docs
    ```
- **Search for "landing page":**
    ```bash
    curl "http://localhost:3000/api/docs?search=landing%20page"
    ```
- **Filter by category "landing":**
    ```bash
    curl "http://localhost:3000/api/docs?category=landing"
    ```

### `GET /sitemap.xml`

```javascript
app.get('/sitemap.xml', async (req, res) => { ... });
```

**Description:**

This route generates and serves a sitemap in XML format for search engine optimization (SEO). It
includes static routes and dynamically generated routes for insights.

**Request:**

- No specific request parameters.

**Response:**

- **Status Code:**

    - `200` (OK): Sitemap generated and served successfully.
    - `500` (Internal Server Error): For any server-side errors (e.g., database query errors).

- **Response Headers:**

    - `Content-Type: application/xml`: Sets the content type to XML for proper sitemap parsing by
      search engines.

- **Response Body (on success - 200):**
    - XML sitemap content. Example:
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://StyleScanner.vip/</loc></url>
    <url><loc>https://StyleScanner.vip/research</loc></url>
    ...
    <url><loc>https://StyleScanner.vip/insight/654c5d6a7b8c9d0a1b2c3d4e</loc></url>
    <url><loc>https://StyleScanner.vip/insight/654c5d6a7b8c9d0a1b2c3d4f</loc></url>
    </urlset>
    ```

**Logic:**

1. **Fetch Insights:** Retrieves all insights from the database using `Insight.find()`.
2. **Define Static Routes:** Creates an array of static routes (e.g., '/', '/research', '/insights',
   etc.) for the application.
3. **Generate URLs for Static Routes:** Maps each static route to a `<url><loc>...</loc></url>` XML
   element, using `https://StyleScanner.vip` as the base URL.
4. **Generate URLs for Insights:** Iterates through the fetched insights and generates a
   `<url><loc>...</loc></url>` XML element for each insight, using
   `https://StyleScanner.vip/insight/${insight._id}` as the URL.
5. **Construct Sitemap XML:** Combines the URLs for static routes and insights into a complete
   sitemap XML structure.
6. **Set Content Type and Send Response:** Sets the `Content-Type` header to `application/xml` and
   sends the sitemap XML as the response.

**Usage Example:**

Access the sitemap directly in a browser or using `curl`:

```bash
curl http://localhost:3000/sitemap.xml
```

### `GET /`

```javascript
app.get('/', async (req, res) => { ... });
```

**Description:**

This route serves the landing page of the application. It reads the `landing.html` file from the
`dist` directory and sends it as the response.

**Request:**

- No specific request parameters.

**Response:**

- **Status Code:**

    - `200` (OK): Landing page served successfully.

- **Response Body (on success - 200):**
    - HTML content of `landing.html`.

**Usage Example:**

Access the root URL of the server in a browser: `http://localhost:3000/`

### `GET *`

```javascript
app.get('*', async (req, res) => { ... });
```

**Description:**

This is a catch-all route that serves the main application's `index.html` file for all other GET
requests that don't match any defined routes. This is typical for single-page applications (SPAs)
where client-side routing handles navigation within the app.

**Request:**

- Any GET request that doesn't match other defined GET routes.

**Response:**

- **Status Code:**

    - `200` (OK): Main application HTML served successfully.

- **Response Body (on success - 200):**
    - HTML content of `index.html`.

**Usage Example:**

Access any URL on the server that is not `/`, `/api/...`, or `/sitemap.xml` (e.g.,
`http://localhost:3000/insights`, `http://localhost:3000/profile`). The server will respond with the
`index.html` file, and client-side routing in the frontend application will handle the actual
navigation.

### 404 Error Handler

```javascript
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
```

**Description:**

This middleware function is executed if no other route handler matches the incoming request. It
sends a 404 Not Found error response.

**Request:**

- Any request that doesn't match any defined routes.

**Response:**

- **Status Code:**

    - `404` (Not Found)

- **Response Body (on error - 404):**
    - `{ error: 'Not found' }`

### Error Handling for Uncaught Exceptions and Unhandled Rejections

```javascript
process.on('uncaughtException', (err, origin) => { ... });
process.on('unhandledRejection', (reason, promise) => { ... });
```

**Description:**

These are global error handlers for Node.js processes to catch uncaught exceptions and unhandled
promise rejections. They log the errors to the console to help with debugging and prevent the server
from crashing unexpectedly.

- `process.on('uncaughtException', ...)`: Catches exceptions that are not caught by try-catch blocks
  in the code.
- `process.on('unhandledRejection', ...)`: Catches promise rejections that are not handled by
  `.catch()` blocks.

**Logic:**

Both handlers simply log the error and origin/reason to the console. In a production environment,
more sophisticated error logging and reporting mechanisms should be implemented.

### `app.listen(port, ...)`

```javascript
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
```

**Description:**

Starts the Express server and makes it listen for incoming requests on the specified `port`. Once
the server starts listening, it logs a message to the console indicating the port number.

### `process.env['GOOGLE_APPLICATION_CREDENTIALS'] = './google.json';`

```javascript
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = './google.json';
```

**Description:**

Sets the `GOOGLE_APPLICATION_CREDENTIALS` environment variable programmatically. This is used to
specify the path to the Google Cloud service account credentials file (`google.json`). This is
likely required for the `analyzeFashionImage` function or other Google Cloud service integrations
within `aiService.js`. It's important to note that setting environment variables this way in code
might not be the best practice for configuration management in all deployment scenarios; environment
variables are typically set outside of the application code in the deployment environment.

This documentation provides a comprehensive overview of the `server/index.js` file, its role in the
project, and detailed descriptions of its functionalities, routes, and middleware. It should help
developers understand the server-side logic and how to interact with the API endpoints.

```

```
