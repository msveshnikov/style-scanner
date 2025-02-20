# File Documentation: src\Admin.jsx

## Overview

The `Admin.jsx` file defines the `Admin` React component, which serves as the administrative
dashboard for the application. This component provides administrators with a comprehensive view of
key application metrics, user management capabilities, insight moderation, and feedback review. It
leverages Chakra UI for styling and layout, `react-chartjs-2` and `chart.js` for data visualization,
and interacts with a backend API (defined by `API_URL` in `src\App.jsx`) to fetch and manage data.

Located within the `src` directory, which typically houses the main frontend source code,
`Admin.jsx` is a crucial part of the application's administrative interface. It is likely rendered
conditionally based on user roles or authentication status, ensuring only authorized personnel can
access and manage the application's backend data.

The dashboard is structured into tabs for easy navigation and organization of different
administrative functions:

- **Overview Tab**: Displays aggregated statistics about the application's performance, user growth
  trends, insight creation patterns, and model usage distribution using charts and stat cards.
- **Users Tab**: Presents a table of users, allowing administrators to view user details, manage
  subscription statuses, and delete user accounts.
- **Insights Tab**: Shows a table of user-generated insights, enabling administrators to review
  insights, adjust their privacy settings (public/private), and delete insights.
- **Feedback Tab**: Lists user feedback submissions, categorized by type (bug, feature, etc.),
  allowing administrators to review messages and delete feedback entries.

## Component: `Admin`

The `Admin` component is the main functional component defined in `Admin.jsx`. It orchestrates data
fetching, state management, and rendering of the admin dashboard UI.

### State Variables

The `Admin` component utilizes several state variables to manage data and UI interactions:

- `stats`: An object holding aggregated statistics fetched from the `/api/admin/dashboard` endpoint.
  It includes overall stats, user growth data, and insight stats.
    ```javascript
    const [stats, setStats] = useState({ stats: {}, userGrowth: [], insightsStats: {} });
    ```

````

- `users`: An array of user objects fetched from the `/api/admin/users` endpoint.
    ```javascript
    const [users, setUsers] = useState([]);
    ```
- `insights`: An array of insight objects fetched from the `/api/admin/insights` endpoint.
    ```javascript
    const [insights, setInsights] = useState([]);
    ```
- `feedbacks`: An array of feedback objects fetched from the `/api/admin/feedbacks` endpoint.
    ```javascript
    const [feedbacks, setFeedbacks] = useState([]);
    ```
- `isDeleteAlertOpen`: A boolean state to control the visibility of the delete confirmation
  AlertDialog.
    ```javascript
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    ```
- `itemToDelete`: An object storing the `id` and `type` of the item being considered for deletion.
  Used by the delete confirmation dialog.
    ```javascript
    const [itemToDelete, setItemToDelete] = useState({ id: null, type: null });
    ```
- `isLoading`: A boolean state indicating whether data is currently being loaded, used to display
  loading spinners and disable buttons during API requests.
    ```javascript
    const [isLoading, setIsLoading] = useState(false);
    ```
- `selectedTab`: An integer representing the index of the currently selected tab in the `Tabs`
  component.
    ```javascript
    const [selectedTab, setSelectedTab] = useState(0);
    ```

### Functions/Methods

#### `fetchData`

- **Description**: Asynchronously fetches data required for the admin dashboard from the backend
  API. This includes dashboard statistics, user data, insight data, and feedback data. It uses
  `Promise.all` to fetch data concurrently and updates the component's state with the fetched data.
  It also handles error scenarios and displays toast notifications using `useToast`.
- **Parameters**: None
- **Return Value**: None (implicitly returns a Promise)
- **Usage**: Called on component mount using `useEffect` and when the "Refresh" button is clicked.

    ```javascript
    const fetchData = useCallback(async () => { ... }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    ```

#### `handleDelete`

- **Description**: Asynchronously handles the deletion of an item (user, insight, or feedback). It
  takes the `itemToDelete` state, determines the API endpoint based on the `type`, sends a DELETE
  request to the backend, and updates the UI upon successful deletion by refetching data using
  `fetchData`. Error handling and toast notifications are also implemented.
- **Parameters**: None
- **Return Value**: None (implicitly returns a Promise)
- **Usage**: Called when the "Delete" button in the AlertDialog is clicked.

    ```javascript
    const handleDelete = useCallback(async () => { ... }, [itemToDelete, fetchData, toast]);
    ```

#### `handleSubscriptionChange`

- **Description**: Asynchronously updates a user's subscription status. It sends a PUT request to
  the `/api/admin/users/:userId/subscription` endpoint with the new subscription status. Upon
  success, it updates the `users` state to reflect the change. Error handling and toast
  notifications are included.
- **Parameters**:
    - `userId`: The ID of the user whose subscription status is to be updated.
    - `newStatus`: The new subscription status (e.g., "active", "canceled").
- **Return Value**: None (implicitly returns a Promise)
- **Usage**: Called when the subscription status Select dropdown is changed in the Users tab table.

    ```javascript
    const handleSubscriptionChange = useCallback(async (userId, newStatus) => { ... }, [toast]);
    ```

#### `handlePrivacyChange`

- **Description**: Asynchronously updates the privacy setting (public/private) of an insight. It
  sends a PUT request to the `/api/admin/insights/:insightId/privacy` endpoint with the new privacy
  status. On success, it updates the `insights` state. Error handling and toast notifications are
  included.
- **Parameters**:
    - `insightId`: The ID of the insight whose privacy setting is to be updated.
    - `newPrivacy`: A boolean indicating the new privacy status (true for private, false for
      public).
- **Return Value**: None (implicitly returns a Promise)
- **Usage**: Called when the Switch component for privacy is toggled in the Insights tab table.

    ```javascript
    const handlePrivacyChange = useCallback(async (insightId, newPrivacy) => { ... }, [toast]);
    ```

#### `renderOverviewTab`

- **Description**: Renders the content for the "Overview" tab. This includes:
    - Stat cards displaying key metrics from `stats.stats`.
    - A Line chart visualizing user growth over time using `stats.userGrowth`.
    - A Line chart visualizing insight growth over time using `stats.insightsStats.insightGrowth`.
    - A Pie chart showing the distribution of insights across different models used, derived from
      the `insights` data.
    - A stat card showing the total number of insights.
- **Parameters**: None
- **Return Value**: JSX.Element - The React elements to render the Overview tab content.
- **Usage**: Called within the `TabPanel` for the "Over" tab in the `Tabs` component.

    ```javascript
    const renderOverviewTab = useCallback(() => { ... }, [stats, insights]);
    ```

### UI Rendering

The `Admin` component renders the following UI elements using Chakra UI components:

- **Container**: Provides a responsive container for the entire dashboard.
- **Heading**: Displays the title "Admin Dashboard".
- **Button**: A "Refresh" button to manually trigger data refetching.
- **Tabs**: Organizes the dashboard into tabbed sections ("Over", "Usrs", "Insights", "Feed").
- **TabList**, **Tab**, **TabPanels**, **TabPanel**: Components for creating and managing tabs.
- **Table**, **Thead**, **Tbody**, **Tr**, **Th**, **Td**: Components for displaying data in tables
  (used in Users, Insights, and Feedback tabs).
- **Select**: Used in the Users tab to update user subscription status.
- **Switch**: Used in the Insights tab to toggle insight privacy.
- **Badge**: Used in the Feedback tab to display feedback type.
- **AlertDialog**: Used to confirm item deletion before proceeding.
- **StatGroup**, **SimpleGrid**, **Stat**, **StatLabel**, **StatNumber**, **Card**, **CardBody**,
  **Box**: Chakra UI layout and stat display components used in the Overview tab.
- **Line**, **Pie**: `react-chartjs-2` components for rendering charts in the Overview tab.
- **Spinner**: Displays a loading spinner when data is being fetched.
- **Center**, **VStack**, **HStack**: Chakra UI layout components.

### Dependencies

The `Admin.jsx` component imports and uses the following modules:

- **React Hooks**:
    - `useState`, `useEffect`, `useCallback`, `useRef` from 'react' for state management, side
      effects, memoization, and referencing DOM elements.
- **Chakra UI Components**:
    - Various components like `Container`, `Table`, `Button`, `Card`, `Tabs`, `AlertDialog`, `Stat`,
      `SimpleGrid`, `Box`, `Spinner`, `Center`, `VStack`, `Heading`, `Select`, `HStack`, `Switch`,
      `Badge`, etc. from '@chakra-ui/react' for building the UI.
    - `useToast` from '@chakra-ui/react' for displaying toast notifications.
    - `DeleteIcon` from '@chakra-ui/icons' for delete icons in buttons.
- **Chart Libraries**:
    - `Line`, `Pie` from 'react-chartjs-2' for rendering charts.
    - `Chart as ChartJS`, `CategoryScale`, `LinearScale`, `PointElement`, `LineElement`,
      `ArcElement`, `BarElement`, `Title`, `Tooltip`, `Legend` from 'chart.js' for chart
      configuration and registration.
- **API Configuration**:
    - `API_URL` from './App' to define the base URL for API requests.

### API Endpoints

The `Admin` component interacts with the following backend API endpoints:

- **`GET ${API_URL}/api/admin/dashboard`**: Fetches dashboard statistics.
- **`GET ${API_URL}/api/admin/users`**: Fetches a list of users.
- **`GET ${API_URL}/api/admin/insights`**: Fetches a list of insights.
- **`GET ${API_URL}/api/admin/feedbacks`**: Fetches a list of user feedbacks.
- **`DELETE ${API_URL}/api/admin/:type/:id`**: Deletes an item (user, insight, or feedback) based on
  its type and ID.
- **`PUT ${API_URL}/api/admin/users/:userId/subscription`**: Updates a user's subscription status.
- **`PUT ${API_URL}/api/admin/insights/:insightId/privacy`**: Updates an insight's privacy setting.

### Usage Example

The `Admin` component is intended to be used within the main application to provide an
administrative interface. It would likely be rendered within a route that is protected and only
accessible to users with administrator roles.

```jsx
// Example of how Admin component might be used in App.jsx or similar routing component
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Admin from './Admin';
import Login from './Login'; // Assuming a Login component exists

function App() {
  const isAdmin = /* ... logic to check if user is admin ... */;
  const isLoggedIn = /* ... logic to check if user is logged in ... */;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {isAdmin && isLoggedIn ? ( // Protect the admin route
          <Route path="/admin" element={<Admin />} />
        ) : (
          <Route path="/admin" element={<p>Unauthorized Access</p>} /> // Or redirect to login
        )}
        {/* ... other routes ... */}
      </Routes>
    </Router>
  );
}

export default App;
```

This documentation provides a comprehensive overview of the `Admin.jsx` component, detailing its
functionality, state management, UI rendering, dependencies, and API interactions. It should serve
as a valuable resource for developers working with this codebase.

```
````
