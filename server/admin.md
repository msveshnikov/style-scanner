````markdown
# Documentation for `server/admin.js`

## Overview

The `server/admin.js` file defines a set of API routes specifically for administrative tasks within
the application. These routes are designed to be accessed only by users with administrator
privileges. It handles operations related to user management, feedback management, insight
management, and provides a dashboard endpoint for key application statistics.

This file is part of the `server` directory in the project, indicating its role in handling backend
logic and API endpoints. It utilizes models defined in `server/models` (`User.js`, `Feedback.js`,
`Insight.js`) to interact with the database and middleware functions from
`server/middleware/auth.js` (`authenticateToken`, `isAdmin`) for securing these administrative
endpoints.

## Dependencies

This file imports the following modules:

- `authenticateToken`, `isAdmin` from `./middleware/auth.js`: Middleware functions for JWT
  authentication and admin role authorization.
- `User` from `./models/User.js`: Mongoose model for the `users` collection.
- `Feedback` from `./models/Feedback.js`: Mongoose model for the `feedbacks` collection.
- `Insight` from `./models/Insight.js`: Mongoose model for the `insights` collection.

## Admin Routes

The `adminRoutes` function is the main export of this file. It takes an Express `app` instance as a
parameter and defines all the admin-related routes on it. Each route is documented below:

### 1. `GET /api/admin/users`

**Description:** Retrieves a list of all users in the system. This route is protected and can only
be accessed by authenticated administrators. User passwords are excluded from the response for
security reasons. The users are sorted by creation date in descending order (newest first).

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `GET`
- Path: `/api/admin/users`
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body: An array of user objects. Each user object contains user details excluding the
      `password` field.

    ```json
    [
        {
            "_id": "user_id_1",
            "email": "user1@example.com",
            "username": "user1",
            "subscriptionStatus": "active",
            "createdAt": "2024-01-01T10:00:00.000Z",
            "updatedAt": "2024-01-01T10:00:00.000Z",
            "__v": 0
        },
        {
            "_id": "user_id_2",
            "email": "user2@example.com",
            "username": "user2",
            "subscriptionStatus": "trialing",
            "createdAt": "2024-01-02T14:30:00.000Z",
            "updatedAt": "2024-01-02T14:30:00.000Z",
            "__v": 0
        }
        // ... more users
    ]
    ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X GET \
  http://localhost:3000/api/admin/users \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>'
```
````

### 2. `GET /api/admin/dashboard`

**Description:** Provides aggregated data for the admin dashboard, including key statistics and
growth trends. This route is protected and accessible only to authenticated administrators. It
fetches data about users, insights, and calculates metrics like conversion rate and user/insight
growth over the last 30 days.

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `GET`
- Path: `/api/admin/dashboard`
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body: JSON object containing dashboard statistics, user growth data, and insight statistics.
        ```json
        {
            "stats": {
                "totalUsers": 150,
                "premiumUsers": 50,
                "trialingUsers": 20,
                "conversionRate": "33.33"
            },
            "userGrowth": [
                { "_id": "2024-07-20", "count": 5 },
                { "_id": "2024-07-21", "count": 2 }
                // ... user growth for last 30 days
            ],
            "insightsStats": {
                "totalInsights": 500,
                "insightGrowth": [
                    { "_id": "2024-07-20", "count": 15 },
                    { "_id": "2024-07-21", "count": 10 }
                    // ... insight growth for last 30 days
                ]
            }
        }
        ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X GET \
  http://localhost:3000/api/admin/dashboard \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>'
```

### 3. `GET /api/admin/feedbacks`

**Description:** Retrieves a list of all feedback entries submitted by users. This route is
protected and accessible only to authenticated administrators. Feedback entries are populated with
the email of the user who submitted the feedback and are sorted by creation date in descending order
(newest first).

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `GET`
- Path: `/api/admin/feedbacks`
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body: An array of feedback objects, populated with user email.
        ```json
        [
            {
                "_id": "feedback_id_1",
                "userId": {
                    "_id": "user_id_1",
                    "email": "user1@example.com"
                },
                "feedbackText": "This is feedback from user 1.",
                "createdAt": "2024-07-22T09:00:00.000Z",
                "updatedAt": "2024-07-22T09:00:00.000Z",
                "__v": 0
            },
            {
                "_id": "feedback_id_2",
                "userId": {
                    "_id": "user_id_2",
                    "email": "user2@example.com"
                },
                "feedbackText": "This is feedback from user 2.",
                "createdAt": "2024-07-22T10:30:00.000Z",
                "updatedAt": "2024-07-22T10:30:00.000Z",
                "__v": 0
            }
            // ... more feedbacks
        ]
        ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X GET \
  http://localhost:3000/api/admin/feedbacks \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>'
```

### 4. `GET /api/admin/insights`

**Description:** Retrieves a list of all insights generated by users. This route is protected and
accessible only to authenticated administrators. Insights are populated with the email of the user
who generated them and are sorted by creation date in descending order (newest first).

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `GET`
- Path: `/api/admin/insights`
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body: An array of insight objects, populated with user email.
        ```json
        [
            {
                "_id": "insight_id_1",
                "userId": {
                    "_id": "user_id_1",
                    "email": "user1@example.com"
                },
                "model": "gemini",
                "prompt": "Generate outfit ideas for a party.",
                "insightText": "Outfit ideas...",
                "isPrivate": false,
                "createdAt": "2024-07-22T11:00:00.000Z",
                "updatedAt": "2024-07-22T11:00:00.000Z",
                "__v": 0
            },
            {
                "_id": "insight_id_2",
                "userId": {
                    "_id": "user_id_2",
                    "email": "user2@example.com"
                },
                "model": "openai",
                "prompt": "Suggest colors for autumn.",
                "insightText": "Autumn color palette...",
                "isPrivate": true,
                "createdAt": "2024-07-22T12:30:00.000Z",
                "updatedAt": "2024-07-22T12:30:00.000Z",
                "__v": 0
            }
            // ... more insights
        ]
        ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X GET \
  http://localhost:3000/api/admin/insights \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>'
```

### 5. `GET /api/admin/insights-model-stats`

**Description:** Retrieves statistics about insight usage per model. This route is protected and
accessible only to authenticated administrators. It aggregates insight data to count the number of
insights generated by each AI model.

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `GET`
- Path: `/api/admin/insights-model-stats`
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body: An array of objects, each showing the count of insights for a specific model.
        ```json
        [
            { "_id": "gemini", "count": 300 },
            { "_id": "openai", "count": 200 }
        ]
        ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X GET \
  http://localhost:3000/api/admin/insights-model-stats \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>'
```

### 6. `DELETE /api/admin/users/:id`

**Description:** Deletes a user and all associated insights from the system. This is a destructive
operation and should be used with caution. This route is protected and accessible only to
authenticated administrators.

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `DELETE`
- Path: `/api/admin/users/:id`
    - `:id`: The ID of the user to delete (path parameter).
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "message": "User and associated data deleted successfully" }
        ```

- **Error (404 Not Found):**

    - Status Code: `404`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "User not found" }
        ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X DELETE \
  http://localhost:3000/api/admin/users/user_id_to_delete \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>'
```

### 7. `DELETE /api/admin/feedbacks/:id`

**Description:** Deletes a specific feedback entry. This route is protected and accessible only to
authenticated administrators.

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `DELETE`
- Path: `/api/admin/feedbacks/:id`
    - `:id`: The ID of the feedback entry to delete (path parameter).
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "message": "Feedback deleted successfully" }
        ```

- **Error (404 Not Found):**

    - Status Code: `404`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Feedback not found" }
        ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X DELETE \
  http://localhost:3000/api/admin/feedbacks/feedback_id_to_delete \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>'
```

### 8. `DELETE /api/admin/insights/:id`

**Description:** Deletes a specific insight. This route is protected and accessible only to
authenticated administrators.

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `DELETE`
- Path: `/api/admin/insights/:id`
    - `:id`: The ID of the insight to delete (path parameter).
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "message": "Insight deleted successfully" }
        ```

- **Error (404 Not Found):**

    - Status Code: `404`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Insight not found" }
        ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X DELETE \
  http://localhost:3000/api/admin/insights/insight_id_to_delete \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>'
```

### 9. `PUT /api/admin/users/:id/subscription`

**Description:** Updates the subscription status of a user. This route is protected and accessible
only to authenticated administrators. Allowed subscription statuses are: `active`, `free`,
`trialing`, `past_due`, `canceled`, `incomplete_expired`.

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `PUT`
- Path: `/api/admin/users/:id/subscription`
    - `:id`: The ID of the user to update (path parameter).
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)
    - `Content-Type: application/json`
- Body:
    ```json
    {
        "subscriptionStatus": "active" // or other valid status
    }
    ```

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "message": "User subscription updated successfully" }
        ```

- **Error (400 Bad Request):**

    - Status Code: `400`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Invalid subscription status" }
        ```

- **Error (404 Not Found):**

    - Status Code: `404`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "User not found" }
        ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X PUT \
  http://localhost:3000/api/admin/users/user_id_to_update/subscription \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{ "subscriptionStatus": "canceled" }'
```

### 10. `PUT /api/admin/insights/:id/privacy`

**Description:** Updates the privacy status (`isPrivate`) of an insight. This route is protected and
accessible only to authenticated administrators.

**Middleware:**

- `authenticateToken`: Ensures the request includes a valid JWT token.
- `isAdmin`: Verifies that the authenticated user has administrator privileges.

**Request:**

- Method: `PUT`
- Path: `/api/admin/insights/:id/privacy`
    - `:id`: The ID of the insight to update (path parameter).
- Headers:
    - `Authorization: Bearer <JWT_TOKEN>` (Required)
    - `Content-Type: application/json`
- Body:
    ```json
    {
        "isPrivate": true // or false
    }
    ```

**Response:**

- **Success (200 OK):**

    - Status Code: `200`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "message": "Insight privacy status updated successfully" }
        ```

- **Error (400 Bad Request):**

    - Status Code: `400`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Invalid private status" }
        ```

- **Error (404 Not Found):**

    - Status Code: `404`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Insight not found" }
        ```

- **Error (500 Internal Server Error):**
    - Status Code: `500`
    - Content-Type: `application/json`
    - Body:
        ```json
        { "error": "Internal server error" }
        ```

**Usage Example:**

```bash
curl -X PUT \
  http://localhost:3000/api/admin/insights/insight_id_to_update/privacy \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{ "isPrivate": false }'
```

---

This documentation provides a comprehensive overview of the `admin.js` file and its API endpoints,
intended for developers who need to understand and maintain the backend admin functionality.

```

```
