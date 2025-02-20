# Documentation for `src\App.jsx`

## Overview

`src\App.jsx` serves as the main entry point for the React frontend application. It is responsible
for setting up the application's core structure, including:

- **Routing:** Utilizing `react-router-dom` to define application routes and navigation.
- **Theming:** Implementing a custom theme using Chakra UI to maintain a consistent visual style.
- **Context Management:** Providing a `UserContext` to manage user authentication state globally.
- **Layout:** Structuring the overall page layout with components like `Navbar`, `Container`, and
  `BottomNavigationBar`.
- **Lazy Loading:** Employing React's `lazy` and `Suspense` to improve initial load time by
  deferring the loading of certain components.
- **Google OAuth Integration:** Configuring Google OAuth for user authentication.
- **API Endpoint Configuration:** Defining the base URL for API requests based on the environment
  (development or production).

This file is the central orchestrator that brings together various components and functionalities to
create the complete user interface of the application.

## Code Block

```jsx
import { ChakraProvider, Box, Container, VStack, extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './Landing';
import { lazy, Suspense, createContext, useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './Navbar';
import Terms from './Terms';
import Privacy from './Privacy';
import Login from './Login';
import SignUp from './SignUp';
import Forgot from './Forgot';
import Reset from './Reset';
import Profile from './Profile';
import { BottomNavigationBar } from './BottomNavigationBar';
import Insights from './Insights';

const StyleScanner = lazy(() => import('./StyleScanner'));
const Admin = lazy(() => import('./Admin'));
const Feedback = lazy(() => import('./Feedback'));
const Docs = lazy(() => import('./Docs'));

export const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'https://stylescanner.vip';
export const UserContext = createContext(null);

const theme = extendTheme({
    colors: {
        primary: { 500: '#282c34' },
        secondary: { 500: '#5c6370', 600: '#a0a7b2' },
        accent: { 500: '#e06c75', 600: '#61afef' }
    },
    fonts: {
        heading: 'Inter, sans-serif',
        body: 'Open Sans, sans-serif'
    }
});

function App() {
    const [user, setUser] = useState();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/api/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
                .then((res) => res.json())
                .then((data) => {
                    setUser(data);
                });
        }
    }, []);

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <ChakraProvider theme={theme}>
                <Suspense
                    fallback={
                        <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            height="100vh"
                        >
                            Loading...
                        </Box>
                    }
                >
                    <UserContext.Provider value={{ user, setUser }}>
                        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                            <Box pb="50px" minH="100vh" bg="gray.50">
                                <Navbar />
                                <Container maxW="container.xl" py={8}>
                                    <VStack spacing={8}>
                                        <Routes>
                                            <Route path="/" element={<Landing />} />
                                            <Route path="/research" element={<Landing />} />
                                            <Route path="/scan" element={<StyleScanner />} />
                                            <Route path="/insights" element={<Insights />} />
                                            <Route path="/privacy" element={<Privacy />} />
                                            <Route path="/terms" element={<Terms />} />
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/signup" element={<SignUp />} />
                                            <Route path="/forgot" element={<Forgot />} />
                                            <Route path="/profile" element={<Profile />} />
                                            <Route path="/feedback" element={<Feedback />} />
                                            <Route
                                                path="/reset-password/:token"
                                                element={<Reset />}
                                            />
                                            <Route path="/admin" element={<Admin />} />
                                            <Route path="/docs/*" element={<Docs />} />
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </VStack>
                                </Container>
                                <BottomNavigationBar />
                            </Box>
                        </Router>
                    </UserContext.Provider>
                </Suspense>
            </ChakraProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
```

## Detailed Explanation

### Imports

The code begins with a series of import statements, bringing in necessary modules and components:

- **Chakra UI Components:**

    - `{ ChakraProvider, Box, Container, VStack, extendTheme } from '@chakra-ui/react';`
        - `ChakraProvider`: Provides the Chakra UI theme and styling context to the application.
        - `Box`, `Container`, `VStack`: Layout components from Chakra UI for structuring the UI.
        - `extendTheme`: Function to customize the default Chakra UI theme.

- **React Router DOM:**

    - `{ BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';`
        - `BrowserRouter`: Enables client-side routing using browser history.
        - `Routes`: Groups and manages `Route` components.
        - `Route`: Defines a specific route path and the component to render for that path.
        - `Navigate`: Component for programmatic redirection.

- **Application Components (Local):**

    - `{ Landing } from './Landing';`
    - `Navbar from './Navbar';`
    - `Terms from './Terms';`
    - `Privacy from './Privacy';`
    - `Login from './Login';`
    - `SignUp from './SignUp';`
    - `Forgot from './Forgot';`
    - `Reset from './Reset';`
    - `Profile from './Profile';`
    - `{ BottomNavigationBar } from './BottomNavigationBar';`
    - `Insights from './Insights';`
    - `const StyleScanner = lazy(() => import('./StyleScanner'));`
    - `const Admin = lazy(() => import('./Admin'));`
    - `const Feedback = lazy(() => import('./Feedback'));`
    - `const Docs = lazy(() => import('./Docs'));`
        - These are components that represent different pages or sections of the application.
          Components like `StyleScanner`, `Admin`, `Feedback`, and `Docs` are lazy-loaded to improve
          performance.

- **React Core Hooks and Utilities:**

    - `{ lazy, Suspense, createContext, useEffect, useState } from 'react';`
        - `lazy`: Enables lazy loading of components.
        - `Suspense`: Provides a way to display fallback content while lazy-loaded components are
          loading.
        - `createContext`: Creates a context object for sharing state across the component tree.
        - `useEffect`: React Hook for performing side effects in functional components.
        - `useState`: React Hook for adding state to functional components.

- **Google OAuth Provider:**
    - `{ GoogleOAuthProvider } from '@react-oauth/google';`
        - `GoogleOAuthProvider`: Provides the context for Google OAuth authentication, requiring a
          client ID.

### Constants

- `export const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'https://stylescanner.vip';`

    - `API_URL`: Defines the base URL for API requests. It dynamically switches between
      `http://localhost:3000` for development (`import.meta.env.DEV` is true) and
      `https://stylescanner.vip` for production. This is configured using Vite's environment
      variable handling.

- `export const UserContext = createContext(null);`
    - `UserContext`: A React Context created to manage user authentication state. It is initialized
      with a default value of `null`. This context will be used to provide and consume user data
      throughout the application.

### Theme

```javascript
const theme = extendTheme({
    colors: {
        primary: { 500: '#282c34' },
        secondary: { 500: '#5c6370', 600: '#a0a7b2' },
        accent: { 500: '#e06c75', 600: '#61afef' }
    },
    fonts: {
        heading: 'Inter, sans-serif',
        body: 'Open Sans, sans-serif'
    }
});
```

- `theme`: A custom Chakra UI theme is created using `extendTheme`.
    - `colors`: Defines custom color palettes named `primary`, `secondary`, and `accent`, each with
      different shades (500, 600).
    - `fonts`: Sets the default fonts for headings (`Inter, sans-serif`) and body text
      (`Open Sans, sans-serif`). This theme is then passed to the `ChakraProvider` to apply to the
      entire application.

### `App` Function Component

The `App` component is the root functional component that structures the entire application.

#### State

- `const [user, setUser] = useState();`
    - `user`: A state variable initialized to `undefined` (or implicitly `null` as no initial value
      is provided, but later set to `null` by `createContext`). It will hold the user's profile data
      if the user is logged in, otherwise, it will be `undefined` or `null`.
    - `setUser`: The state setter function to update the `user` state.

#### `useEffect` Hook

```javascript
useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${API_URL}/api/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                setUser(data);
            });
    }
}, []);
```

- This `useEffect` hook runs once after the initial render (due to the empty dependency array `[]`).
    - **Authentication Check:** It retrieves a token from `localStorage`.
    - **Profile Fetch:** If a token exists, it fetches the user profile from the `/api/profile`
      endpoint using the `API_URL` and includes the token in the `Authorization` header as a Bearer
      token.
    - **User State Update:** Upon successful fetch, it parses the JSON response and updates the
      `user` state using `setUser(data)`. This effectively logs in the user if a valid token is
      found in local storage.

#### JSX Structure and Routing

```jsx
return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <ChakraProvider theme={theme}>
            <Suspense
                fallback={/* ... Loading UI ... */}
            >
                <UserContext.Provider value={{ user, setUser }}>
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <Box pb="50px" minH="100vh" bg="gray.50">
                            <Navbar />
                            <Container maxW="container.xl" py={8}>
                                <VStack spacing={8}>
                                    <Routes>
                                        {/* Routes defined here */}
                                    </Routes>
                                </VStack>
                            </Container>
                            <BottomNavigationBar />
                        </Box>
                    </Router>
                </UserContext.Provider>
            </Suspense>
        </ChakraProvider>
    </GoogleOAuthProvider>
);
```

- **`GoogleOAuthProvider`**: Wraps the entire application to provide Google OAuth context. It
  requires `clientId` from environment variables (`import.meta.env.VITE_GOOGLE_CLIENT_ID`).

- **`ChakraProvider`**: Wraps the application to provide the custom Chakra UI theme defined earlier.

- **`Suspense`**: Handles lazy loading.

    - `fallback`: Displays a loading message (`<Box>Loading...</Box>`) while lazy-loaded components
      are being fetched.

- **`UserContext.Provider`**: Makes the `user` state and `setUser` function available to all
  components within the application via the `UserContext`.

    - `value={{ user, setUser }}`: Provides the current `user` state and the `setUser` function to
      consuming components.

- **`Router` (BrowserRouter)**: Enables routing within the application.

    - `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}`: Configures future flags
      for React Router v7 compatibility.

- **`Box`**: A Chakra UI layout component.

    - `pb="50px"`: Adds padding at the bottom to accommodate the `BottomNavigationBar`.
    - `minH="100vh"`: Sets the minimum height to 100% of the viewport height.
    - `bg="gray.50"`: Sets the background color to a light gray from Chakra UI's color palette.

- **`Navbar`**: The application's navigation bar component, rendered at the top.

- **`Container`**: A Chakra UI component to constrain content width for larger screens.

    - `maxW="container.xl"`: Sets the maximum width to Chakra UI's `xl` container size.
    - `py={8}`: Adds vertical padding (top and bottom) of size 8 from Chakra UI's spacing scale.

- **`VStack`**: A Chakra UI component that stacks its children vertically.

    - `spacing={8}`: Adds vertical spacing of size 8 between child components.

- **`Routes`**: Defines the application's routes.

    - **`Route` components**: Each `Route` component defines a path and the component to render when
      that path is matched.
        - `/`: Renders `Landing` component.
        - `/research`: Renders `Landing` component (same as root path, possibly for different
          landing contexts).
        - `/scan`: Renders `StyleScanner` (lazy-loaded).
        - `/insights`: Renders `Insights`.
        - `/privacy`: Renders `Privacy`.
        - `/terms`: Renders `Terms`.
        - `/login`: Renders `Login`.
        - `/signup`: Renders `SignUp`.
        - `/forgot`: Renders `Forgot`.
        - `/profile`: Renders `Profile`.
        - `/feedback`: Renders `Feedback` (lazy-loaded).
        - `/reset-password/:token`: Renders `Reset` component, with `:token` as a route parameter.
        - `/admin`: Renders `Admin` (lazy-loaded).
        - `/docs/*`: Renders `Docs` (lazy-loaded) and allows for nested routes under `/docs`. The
          `*` indicates it will match any path starting with `/docs/`.
        - `*`: A catch-all route that renders `Navigate to="/" replace`, redirecting any unmatched
          path to the root path (`/`). `replace` ensures the current history entry is replaced
          instead of adding a new one.

- **`BottomNavigationBar`**: The application's bottom navigation bar component, rendered at the
  bottom.

### File Role in Project

Based on the project structure, `App.jsx` is located in the `src` directory, which is the standard
location for source code in React projects. As the name suggests and as detailed in the overview,
`App.jsx` is the central component that bootstraps the entire frontend application.

- It is the starting point for the React application, rendered in `src\main.jsx` (which is typically
  the entry point defined in `index.html`).
- It orchestrates the routing logic using `react-router-dom`, connecting URLs to specific
  components.
- It sets up the visual theme using Chakra UI, ensuring a consistent look and feel across the
  application.
- It manages user authentication state through `UserContext`, making user information accessible
  throughout the application.
- By using lazy loading for certain components, it optimizes the initial loading performance of the
  application.
- It integrates with the backend API using the `API_URL` constant, configured for different
  environments.

In essence, `App.jsx` is the foundational component that brings together all the different parts of
the frontend application and makes it functional and navigable for the user.
