# StyleScanner.VIP - Project Documentation

## 1. Project Overview

StyleScanner.VIP is a cutting-edge web application designed to provide users with instant,
AI-powered feedback on their personal style. By simply uploading a photo of their outfit, users
receive actionable insights and personalized recommendations to enhance their fashion choices. The
application aims to be intuitive and effortless, making style refinement accessible to everyone.

**Target Audience:**

- Individuals seeking to improve their personal style and fashion sense.
- Users who want quick and objective feedback on their outfit choices.
- Fashion enthusiasts looking for AI-driven style recommendations.
- Users who value convenience and accessibility in style advice.

**Key Features:**

- **AI-Powered Style Analysis:** Leverages multiple AI models (OpenAI, Claude, Gemini, DeepSeek) to
  provide comprehensive and nuanced style feedback.
- **Personalized Insights:** Tailored recommendations based on outfit analysis, helping users
  understand what works and what can be improved.
- **User Profiles & History:** Allows users to track their style evolution and revisit past
  insights.
- **Multi-Device Accessibility:** Responsive design and PWA capabilities ensure seamless access
  across desktops, tablets, and mobile devices, even offline.
- **Community Feedback System:** Enables users to connect and share feedback, fostering a community
  of style enthusiasts.
- **Secure Authentication:** Implements secure user authentication to protect user data and privacy.
- **Admin Interface:** Provides an administrative panel for content management and system oversight.

StyleScanner.VIP is built with a focus on user experience, leveraging modern web technologies to
deliver a fast, reliable, and engaging platform for style enhancement.

## 2. Architecture Description

StyleScanner.VIP adopts a modular architecture, separating the frontend user interface from backend
services. This design promotes scalability, maintainability, and independent development of
different components.

### 2.1. Frontend Architecture

- **Technology:** React with Vite
- **Structure:** Component-based architecture with distinct routes for different functionalities:
    - **Authentication Routes:** `/login`, `/signup`, `/forgot`, `/reset` (based on file names
      `Login.jsx`, `SignUp.jsx`, `Forgot.jsx`, `Reset.jsx`).
    - **Main Application Routes:** Likely root path `/` for landing page (`Landing.jsx`),
      `/style-scanner` or similar for the core style scanning feature (`StyleScanner.jsx`),
      `/insights` (`Insights.jsx`), `/profile` (`Profile.jsx`), `/feedback` (`Feedback.jsx`),
      `/docs` (`Docs.jsx`), `/privacy` (`Privacy.jsx`), `/terms` (`Terms.jsx`), `/admin`
      (`Admin.jsx`).
    - **Shared Components:** Reusable UI elements like `Navbar.jsx` and `BottomNavigationBar.jsx`
      for consistent navigation across the application.
- **Design System:** Responsive design principles with a mobile-first approach, ensuring optimal
  viewing experience on various screen sizes.
- **State Management:** Likely utilizes React's state management capabilities or a state management
  library (though not explicitly listed in dependencies, it's standard practice for React apps of
  this complexity) to manage user authentication status, style insights data, and UI states.
- **Progressive Web App (PWA):** Implemented with service workers for offline capabilities,
  enhancing user experience and accessibility.
- **Client-Side Routing:** React Router DOM is used for managing navigation and routing within the
  frontend application.

### 2.2. Backend Architecture

- **Technology:** Node.js with Express
- **Structure:** Modular API design with separate services for different functionalities:
    - **API Endpoints:** RESTful API design for communication with the frontend. Endpoints are
      likely structured around resources like `/users`, `/insights`, `/feedbacks`, and potentially
      `/style-analysis`.
    - **AI Model Integrations:** Dedicated services for each AI model (OpenAI, Claude, Gemini,
      DeepSeek) located in files like `openai.js`, `claude.js`, `gemini.js`, `deepseek.js`. These
      services likely handle API calls and data processing for each model. An `imageService.js`
      likely handles image processing tasks related to outfit analysis.
    - **Database:** MongoDB with Mongoose for data modeling. Models are defined in `server/models`
      directory: `User.js`, `Insight.js`, `Feedback.js`.
    - **Authentication:** JWT (JSON Web Tokens) based authentication implemented via middleware
      (`auth.js`) to secure API endpoints and user data.
    - **Search Functionality:** `search.js` likely provides search capabilities for style insights
      and user history.
    - **Admin Functionality:** `admin.js` manages administrative tasks and operations.

### 2.3. Integration & DevOps

- **Containerization:** Docker is used for containerizing both the backend and MongoDB services,
  ensuring consistent development, testing, and deployment environments. `docker-compose.yml`
  defines the service configurations.
- **Deployment:** Automated deployment scripts (`deploy.cmd`) streamline the deployment process,
  likely involving transferring built frontend assets and backend code to a server.
- **Environment Configuration:** Environment variables are used to manage configuration settings for
  different environments (development, production), as seen in `docker-compose.yml`.
- **Database Management:** MongoDB Playground (`playground-1.mongodb.js`) is used for database
  initialization, data seeding, and administration tasks.
- **API Communication:** RESTful API facilitates communication between the React frontend and
  Node.js backend, exchanging data in JSON format.
- **Error Handling and Logging:** Comprehensive error handling and logging are implemented
  throughout the application to monitor performance and debug issues.

## 3. Module Interactions

### 3.1. Frontend Modules

- **`main.jsx`**: Entry point of the React application. Mounts the `App.jsx` component to the root
  DOM element.
- **`App.jsx`**: Main application component. Sets up routing using React Router DOM, defining routes
  for different pages like `Landing`, `Login`, `SignUp`, `StyleScanner`, `Insights`, `Profile`,
  `Admin`, etc. Likely includes context providers for authentication and other global states.
- **`Navbar.jsx` & `BottomNavigationBar.jsx`**: Navigation components used across different layouts
  to provide consistent user navigation. `Navbar` likely for desktop and `BottomNavigationBar` for
  mobile.
- **`Landing.jsx`**: Component for the landing page, likely showcasing the application's features
  and benefits.
- **`Login.jsx`, `SignUp.jsx`, `Forgot.jsx`, `Reset.jsx`**: Components for user authentication
  functionalities. Interact with backend API endpoints for user registration, login, password
  recovery.
- **`StyleScanner.jsx`**: Core component for outfit analysis. Handles image uploads, interacts with
  backend API to send images for AI analysis, and displays the received style insights.
- **`Insights.jsx`**: Component to display user's style insights history and potentially aggregated
  insights. Fetches data from backend API.
- **`Profile.jsx`**: Component for user profile management, allowing users to view and edit their
  profile information. Interacts with backend API for user data.
- **`Admin.jsx`**: Component for administrative tasks, accessible only to admin users. Interacts
  with backend admin API endpoints.
- **`Feedback.jsx`**: Component to allow users to submit feedback. Sends feedback data to backend
  API.
- **`Docs.jsx`, `Privacy.jsx`, `Terms.jsx`**: Components for displaying documentation, privacy
  policy, and terms of service. Content might be statically rendered or fetched from backend.

### 3.2. Backend Modules

- **`index.js`**: Main server file. Sets up the Express server, middleware (authentication, CORS,
  etc.), and defines API routes. Imports and utilizes route handlers from other modules (`user.js`,
  `admin.js`, `search.js`, `imageService.js`, `openai.js`, `claude.js`, `gemini.js`, `deepseek.js`).
- **`user.js`**: Handles user-related API endpoints (e.g., `/api/users/login`, `/api/users/signup`,
  `/api/users/profile`). Interacts with the `User` model to manage user data in MongoDB and
  `auth.js` middleware for authentication.
- **`admin.js`**: Handles admin-related API endpoints (e.g., user management, content management).
  Protected by authentication middleware to ensure only admin users can access.
- **`search.js`**: Handles search functionality, likely providing API endpoints for searching
  insights or user data. Interacts with MongoDB to perform searches.
- **`imageService.js`**: Handles image processing tasks. Receives image uploads from the frontend,
  processes them (e.g., resizing, format conversion), and sends them to AI model services for
  analysis.
- **`openai.js`, `claude.js`, `gemini.js`, `deepseek.js`**: Each of these modules encapsulates the
  logic for interacting with a specific AI model's API. They receive processed images from
  `imageService.js`, send them to their respective AI APIs, process the responses, and return
  structured style insights.
- **`models/User.js`, `models/Insight.js`, `models/Feedback.js`**: Mongoose models defining the
  schema for user data, style insights, and feedback in MongoDB. Used by backend modules to interact
  with the database.
- **`middleware/auth.js`**: Authentication middleware. Verifies JWT tokens sent in requests to
  protected API endpoints, ensuring only authenticated users can access certain resources.

### 3.3. Workflow Example: User Style Analysis

1.  User uploads an outfit photo through the `StyleScanner.jsx` frontend component.
2.  `StyleScanner.jsx` sends the image to the backend API endpoint (e.g., `/api/style-analysis`) via
    a POST request.
3.  The backend API (likely handled in `index.js` and related modules) receives the image.
4.  `imageService.js` processes the image (e.g., resizing, format conversion).
5.  The processed image is then sent to each of the AI model services (`openai.js`, `claude.js`,
    `gemini.js`, `deepseek.js`).
6.  Each AI model service analyzes the image and returns style insights.
7.  The backend aggregates or processes insights from all AI models (logic for multi-model
    aggregation is noted as a future enhancement but might have basic implementation already).
8.  The aggregated style insights are stored in the database using the `Insight` model.
9.  The backend API sends the style insights back to the `StyleScanner.jsx` frontend component as a
    JSON response.
10. `StyleScanner.jsx` displays the insights to the user.

## 4. Installation & Usage

### 4.1. Prerequisites

- **Node.js and npm/bun:** Ensure Node.js and bun package manager are installed on your development
  machine. Bun is specified in Dockerfile and package.json, suggesting it's the preferred package
  manager.
- **Docker:** Docker and Docker Compose should be installed for containerized development and
  deployment.
- **MongoDB:** While MongoDB is containerized with Docker Compose, having MongoDB shell tools might
  be useful for direct database interaction if needed.
- **Environment Variables:** You will need to set up environment variables for API keys, database
  connection, and other configurations as listed in `docker-compose.yml`:
    - `OPENAI_KEY`, `DEEPSEEK_KEY`, `GOOGLE_KEY`, `CLAUDE_KEY`, `UNSPLASH_API_KEY`,
      `GOOGLE_CLIENT_ID`, `GA_API_SECRET`, `STRIPE_KEY`, `STRIPE_WH_SECRET`, `JWT_SECRET`, `EMAIL`,
      `FROM_EMAIL`, `EMAIL_PASSWORD`.
    - Create a `.env` file at the project root and define these variables.

### 4.2. Development Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd stylescanner-vip
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    cd server
    bun install
    cd ..
    ```

3.  **Set up environment variables:**

    - Create a `.env` file in the project root and populate it with necessary environment variables.
      You can obtain API keys from the respective AI model providers and services. For local
      development, you can use placeholder values for some keys, but for full functionality, you'll
      need valid API keys.
    - Example `.env` file:
        ```env
        OPENAI_KEY=your_openai_api_key
        DEEPSEEK_KEY=your_deepseek_api_key
        GOOGLE_KEY=your_google_api_key
        CLAUDE_KEY=your_claude_api_key
        UNSPLASH_API_KEY=your_unsplash_api_key
        GOOGLE_CLIENT_ID=your_google_client_id
        GA_API_SECRET=your_ga_api_secret
        STRIPE_KEY=your_stripe_secret_key
        STRIPE_WH_SECRET=your_stripe_webhook_secret
        JWT_SECRET=your_jwt_secret_key
        EMAIL=your_email@example.com
        FROM_EMAIL=from_email@example.com
        EMAIL_PASSWORD=your_email_password
        FRONTEND_URL=http://localhost:5173 # Default Vite dev server URL
        NODE_ENV=development
        ```

4.  **Run development servers:**

    - **Start the backend and MongoDB using Docker Compose:**
        ```bash
        docker-compose up --build
        ```
    - **Start the frontend development server (in a separate terminal):**
        ```bash
        bun run dev
        ```

5.  **Access the application:**
    - Frontend application will be accessible at `http://localhost:5173` (or the URL shown in the
      Vite console).
    - Backend API will be running on `http://localhost:8021`.

### 4.3. Building for Production

1.  **Build the frontend:**

    ```bash
    bun run build
    ```

    This will create a production-ready build of the frontend in the `dist` directory.

2.  **Build the Docker image:**

    ```bash
    docker-compose build
    ```

3.  **Run the production application using Docker Compose:**
    ```bash
    docker-compose up -d
    ```
    This will start the backend and MongoDB containers in detached mode (running in the background).
    The application will be accessible at the port mapped in `docker-compose.yml` (port `8021`
    externally mapped to `3000` internally, but likely accessed through a reverse proxy in a real
    deployment).

### 4.4. Deployment

The `deploy.cmd` script suggests a simple deployment process using `scp` to copy files to a remote
server. A more robust deployment pipeline would typically involve CI/CD tools for automated
building, testing, and deployment.

1.  **Configure `deploy.cmd`:**

    - Update the `ubuntu@mangatv.shop:/var/www/style/` part of `deploy.cmd` with your actual remote
      server address and deployment path.

2.  **Run the deployment script:**
    ```bash
    deploy.cmd
    ```
    This script will copy all files in the current directory to the specified remote server path.
    Ensure you have SSH access configured for passwordless login or handle password prompts
    appropriately.

**Note:** This deployment method is basic and likely for initial setup or simple deployments. For
production environments, consider using more sophisticated deployment strategies like CI/CD
pipelines, blue/green deployments, etc.

### 4.5. Exporting MongoDB Data

The `copy.cmd` script provides a way to export data from the MongoDB database running in the Docker
container.

1.  **Configure `copy.cmd`:**

    - Update `REMOTE_USER`, `REMOTE_HOST`, and `REMOTE_DIR` variables in `copy.cmd` to match your
      remote server and MongoDB container setup.

2.  **Run the copy script:**
    ```bash
    copy.cmd
    ```
    This script will:
    - Execute `mongoexport` commands within the MongoDB Docker container on the remote server to
      export `users`, `insights`, and `feedbacks` collections to CSV files.
    - Use `scp` to copy these CSV files from the remote server to your local machine in the current
      directory.

This is useful for backups or migrating data.

## 5. Future Enhancements

As outlined in the `README.md`, the project has several planned future enhancements:

- **Multi-model AI insight aggregation system:** Improve the way insights from different AI models
  are combined to provide a more unified and comprehensive analysis.
- **Real-time style recommendations:** Implement real-time feedback as users make changes to their
  outfits (e.g., using live camera input or interactive outfit builders).
- **Social sharing and community features:** Expand community engagement by enabling users to share
  their insights, outfits, and feedback with others on the platform and social media.
- **Advanced user analytics dashboard:** Provide users with detailed analytics on their style
  evolution, trends, and preferences over time.
- **Enhanced admin interface for content management:** Improve the admin panel for easier content
  updates, user management, and system monitoring.
- **Mobile app deployment:** Develop dedicated mobile applications for iOS and Android platforms to
  provide a native mobile experience.
- **AI model performance optimization:** Continuously refine and optimize the AI models for better
  accuracy, speed, and cost-efficiency.
- **Integrated payment system for premium features:** Implement a payment system (likely using
  Stripe, as indicated by environment variables) to offer premium features, such as advanced
  insights, personalized style consultations, or ad-free experience.

## 6. Brand Identity Kit

StyleScanner.VIP's brand identity is defined by:

- **Color Palette:**

    - **Primary:** `#282c34` (Dark background color)
    - **Secondary:** `#5c6370`, `#a0a7b2` (Neutral grays for text and UI elements)
    - **Accent:** `#e06c75` (Red/Pink for highlights and calls to action), `#61afef` (Blue for links
      and interactive elements)

- **Typography:**

    - **Headings:** Inter, sans-serif (Modern, clean, and readable for titles and headings)
    - **Body:** Open Sans, sans-serif (Classic, legible, and versatile for body text)
    - **Accent:** Montserrat, sans-serif (Stylish, geometric, and distinctive for emphasis)

- **Brand Voice:**

    - Professional yet approachable, conveying expertise and trustworthiness while remaining
      friendly and accessible to a wide audience.
    - Tech-savvy and fashion-forward, highlighting the use of AI and modern technology in the
      fashion domain.
    - Data-driven with a personal touch, emphasizing the analytical and personalized nature of the
      insights.

- **Core Values:**
    - **Multi-model AI accuracy:** Commitment to providing reliable and accurate style insights
      through advanced AI technology.
    - **User-centric design:** Focus on creating an intuitive, user-friendly, and enjoyable
      experience.
    - **Continuous innovation:** Dedication to ongoing improvement and integration of new features
      and technologies.
    - **Community engagement:** Value of building a community of style enthusiasts and fostering
      interaction.
    - **Privacy and security focus:** Prioritizing user data protection and ensuring a secure
      platform.

This comprehensive documentation provides a detailed understanding of the StyleScanner.VIP project,
covering its architecture, functionalities, setup, and future direction. It serves as a valuable
resource for developers, contributors, and anyone interested in learning more about the application.
