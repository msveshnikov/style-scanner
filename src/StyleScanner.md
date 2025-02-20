````markdown
# Documentation for `src\StyleScanner.jsx`

## Overview

The `StyleScanner.jsx` file defines the `StyleScanner` React component. This component is the core
feature of the application, allowing users to upload a photo of their outfit and receive AI-powered
style insights and recommendations. It provides a user-friendly interface for uploading images,
adjusting analysis parameters like depth, and opting for detailed analysis (subject to subscription
status). The component interacts with a backend API to perform the style analysis and displays the
results, including outfit analysis, style score, and recommendations.

This component is likely a central part of a fashion or style application, as indicated by its name
and functionality. It resides within the `src` directory, suggesting it's a key component within the
frontend application, potentially interacting with other components like `App.jsx` for context and
`Navbar.jsx`, `BottomNavigationBar.jsx` for UI structure. The presence of a `server` directory with
files like `aiService.js`, `openai.js`, and `gemini.js` strongly suggests that the backend handles
the AI-driven style analysis, and `StyleScanner.jsx` is responsible for the frontend interaction
with this backend.

## Component: `StyleScanner`

This is the main functional component defined in `StyleScanner.jsx`. It encapsulates all the logic
and UI for the style scanning feature.

**Functionality:**

- **Image Upload**: Allows users to upload an image of their outfit.
- **Analysis Depth Control**: Provides a slider to adjust the depth of the style analysis.
- **Detailed Analysis Toggle**: Offers a switch to enable detailed analysis, which may be a premium
  feature.
- **Style Scanning**: Sends the uploaded image and analysis parameters to a backend API for
  processing.
- **Insight Display**: Presents the analysis results, including outfit analysis, style score, and
  recommendations, in a structured format.
- **Subscription Check**: Enforces subscription requirements for detailed analysis.
- **Loading State**: Displays a loading spinner while the style analysis is in progress.
- **Error Handling**: Provides user-friendly error messages using toast notifications.

**Imports:**

- **Chakra UI Components:**
    - `Box`, `FormControl`, `FormLabel`, `Input`, `Button`, `VStack`, `Text`, `Heading`, `Switch`,
      `Slider`, `SliderTrack`, `SliderFilledTrack`, `SliderThumb`, `SimpleGrid`, `Image`, `Card`,
      `CardHeader`, `CardBody`, `Stack`, `Divider`, `Spinner`, `InputGroup`: Used for building the
      user interface and applying consistent styling.
- **React Hooks:**
    - `useContext`, `useRef`, `useState`: Essential React hooks for managing component state,
      context, and references.
- **Context and Constants from `App.jsx`:**
    - `API_URL`, `UserContext`: `API_URL` likely defines the base URL for backend API calls.
      `UserContext` is used to access user-related information, specifically subscription status,
      likely provided by the parent `App` component.
- **Icons:**
    - `AiOutlineUpload` from `react-icons/ai`: Upload icon for the upload button.

**State Variables:**

- `file`: `useState(null)`
    - **Type:** `File | null`
    - **Description:** Stores the currently selected image file object. Initialized to `null`.
- `preview`: `useState('')`
    - **Type:** `string` (URL)
    - **Description:** Stores the URL for the image preview, generated using
      `URL.createObjectURL(file)`. Initialized to an empty string.
- `analysisDepth`: `useState(0.7)`
    - **Type:** `number` (between 0 and 1)
    - **Description:** Stores the analysis depth value, controlled by the slider. Represents the
      level of detail in the analysis. Initialized to `0.7`.
- `detailedAnalysis`: `useState(false)`
    - **Type:** `boolean`
    - **Description:** Indicates whether detailed analysis is enabled, toggled by the switch.
      Initialized to `false`.
- `scanning`: `useState(false)`
    - **Type:** `boolean`
    - **Description:** Indicates whether the style scanning process is currently in progress. Used
      to display a loading state. Initialized to `false`.
- `insights`: `useState(null)`
    - **Type:** `object | null`
    - **Description:** Stores the insights data received from the backend API after successful style
      analysis. Initialized to `null`.

**Contexts:**

- `UserContext`:
    - **Source:** `import { UserContext } from './App';`
    - **Description:** Used to access user-related information, specifically
      `user.subscriptionStatus`. This is used to gate the "Detailed Analysis" feature based on the
      user's subscription.

**Refs:**

- `fileInputRef`: `useRef(null)`
    - **Type:** `React.RefObject<HTMLInputElement>`
    - **Description:** A ref attached to the hidden file input element. Used to programmatically
      trigger the file input dialog when the "Upload Photo" button is clicked.

**Hooks:**

- `useToast()`:
    - **Source:** `import { useToast } from '@chakra-ui/react';`
    - **Description:** Chakra UI hook for displaying toast notifications. Used to show success,
      error, and warning messages to the user.

**Functions/Methods:**

- `handleFileChange(e)`

    - **Description:** Handles the change event of the file input.
    - **Parameters:**
        - `e`: `Event` - The file input change event.
    - **Return Value:** `void`
    - **Functionality:**
        1. Checks if files were selected (`e.target.files && e.target.files[0]`).
        2. Gets the selected file from `e.target.files[0]`.
        3. Updates the `file` state with the selected file.
        4. Creates a preview URL using `URL.createObjectURL(selectedFile)` and updates the `preview`
           state.
        5. Clears any previous insights by setting `insights` state to `null`. This ensures fresh
           insights are loaded for each new image.

- `handleDetailedAnalysisChange(e)`

    - **Description:** Handles the change event of the "Detailed Analysis" switch.
    - **Parameters:**
        - `e`: `Event` - The switch change event.
    - **Return Value:** `void`
    - **Functionality:**
        1. Gets the checked state of the switch (`e.target.checked`).
        2. Checks if detailed analysis is requested (`wantsDetailed`) and if the user's subscription
           status from `UserContext` is not 'active' or 'trialing'.
        3. If detailed analysis is requested but the user is not subscribed, displays a warning
           toast notification using `useToast()` informing them about the subscription requirement
           and returns early, preventing the state update.
        4. If the user is subscribed or detailed analysis is not requested, updates the
           `detailedAnalysis` state with the new switch state.

- `handleGenerateStyleInsights(e)`

    - **Description:** Handles the click event of the "Scan Style" button. Initiates the style
      analysis process.
    - **Parameters:**
        - `e`: `Event` - The button click event.
    - **Return Value:** `Promise<void>` (async function)
    - **Functionality:**
        1. Prevents default form submission behavior (`e.preventDefault()`).
        2. Checks if a file has been uploaded (`!file`). If not, displays an error toast
           notification asking the user to upload a photo and returns early.
        3. Sets the `scanning` state to `true` to indicate loading.
        4. Clears any previous insights by setting `insights` state to `null`.
        5. Creates a `FileReader` to read the image file as a data URL.
        6. Defines the `reader.onloadend` callback function, which is executed after the file is
           read.
            - Inside `onloadend`:
                - Extracts the base64 encoded image data from `reader.result`.
                - Retrieves the authentication token from `localStorage`.
                - Makes a `POST` request to the `/api/generate-insight` endpoint (defined by
                  `API_URL`).
                - Sets headers: `Content-Type: 'application/json'` and
                  `Authorization: 'Bearer ${token}'` if a token exists.
                - Sends a JSON payload in the request body containing:
                    - `imageSource`: base64 encoded image.
                    - `analysisDepth`: current `analysisDepth` state.
                    - `stylePreferences`: 'Detailed analysis requested' if `detailedAnalysis` is
                      true, otherwise an empty string.
                - Handles the API response:
                    - If the response is not `ok` (error status):
                        - Checks for 403 status code (likely unauthorized) and throws a specific
                          error message.
                        - Parses the error response JSON and throws an error with the error message
                          from the backend or a default message "Failed to scan style".
                    - If the response is `ok`:
                        - Parses the JSON response and extracts the `insights` data.
                        - Updates the `insights` state with the received data.
                - Catches any errors during the API call:
                    - Displays an error toast notification with the error message.
                - Finally block:
                    - Sets the `scanning` state to `false` regardless of success or failure to stop
                      loading.
        7. Starts reading the file as a data URL using `reader.readAsDataURL(file)`.

- `handleButtonClick()`

    - **Description:** Handles the click event of the "Upload Photo" button. Programmatically
      triggers the file input dialog.
    - **Parameters:** None
    - **Return Value:** `void`
    - **Functionality:**
        1. Calls `fileInputRef.current.click()` to programmatically click the hidden file input
           element, opening the file selection dialog for the user.

- `return ()` (JSX)
    - **Description:** Defines the UI structure of the `StyleScanner` component.
    - **Return Value:** JSX representing the component's UI.
    - **Structure:**
        - `Box`: Main container for the component, using Chakra UI styling for padding and max
          width.
        - `SimpleGrid`: Layout container to create a two-column grid layout for larger screens and a
          single column for smaller screens.
            - **Left Column (Card 1: Upload Outfit):**
                - `Card`: Chakra UI Card component to group the upload and settings section.
                - `CardHeader`: Heading "Upload Your Outfit".
                - `CardBody`: Contains the form elements.
                    - `VStack`: Vertical stack to arrange form elements.
                    - `FormControl` (Outfit Photo):
                        - `FormLabel`: "Outfit Photo".
                        - `InputGroup`: To group the button and hidden input.
                            - `Button` ("Upload Photo"):
                                - `leftIcon`: Upload icon.
                                - `onClick`: `handleButtonClick` to trigger file input.
                            - `Input` (hidden file input):
                                - `type="file"`, `accept="image/*"`, `onChange`: `handleFileChange`,
                                  `hidden`, `ref`: `fileInputRef`.
                    - `FormControl` (Analysis Depth):
                        - `FormLabel`: "Analysis Depth".
                        - `Slider`: Chakra UI Slider to control `analysisDepth`.
                        - `Text`: Displays the current depth percentage.
                    - `FormControl` (Detailed Analysis):
                        - `FormLabel`: "Detailed Analysis™".
                        - `Switch`: Chakra UI Switch to toggle `detailedAnalysis`, `onChange`:
                          `handleDetailedAnalysisChange`.
                    - `Button` ("Scan Style"):
                        - `colorScheme="primary"`, `size="lg"`, `w="full"`, `type="submit"`,
                          `isLoading`: `scanning`, `loadingText="Scanning..."`, `onClick`:
                          `handleGenerateStyleInsights`.
            - **Right Column (Card 2: Outfit Preview & Insights):**
                - `Card`: Chakra UI Card component to group the preview and insights section.
                - `CardHeader`: Heading "Outfit Preview & Insights".
                - `CardBody`: Contains the preview and insights display.
                    - `Stack`: Vertical stack for preview, spinner, and insights.
                    - Conditional rendering for `preview`:
                        - `Image`: Displays the image preview if `preview` URL is available.
                        - `Box`: Placeholder text "No image selected" if no preview.
                    - Conditional rendering for `scanning`:
                        - `Spinner`: Displays a loading spinner if `scanning` is true.
                    - Conditional rendering for `insights`:
                        - `Box`: Container for insights if `insights` data is available.
                            - `Divider`: Separator.
                            - Conditional rendering for `insights.outfitAnalysis`:
                                - `Box`: Container for outfit analysis details.
                                - `Heading`: "Outfit Analysis".
                                - `Text` elements to display `overallStyle`, `fitAssessment`,
                                  `colorPalette`, and `items` from `insights.outfitAnalysis`. Uses
                                  `VStack` to list items.
                            - Conditional rendering for `insights.styleScore`:
                                - `Box`: Container for style score.
                                - `Text`: "Style Score:".
                                - `Text`: Displays `insights.styleScore`.
                            - Conditional rendering for `insights.recommendations`:
                                - `Box`: Container for recommendations.
                                - `Text`: "Recommendations:".
                                - Conditional rendering for array or string
                                  `insights.recommendations`:
                                    - `VStack`: Lists recommendations if `insights.recommendations`
                                      is an array.
                                    - `Text`: Displays recommendation as text if it's a string.
                            - Conditional rendering for `insights.benefits`:
                                - `Box`: Container for benefits.
                                - `Text`: "Benefits:".
                                - `VStack`: Lists benefits if `insights.benefits` is an array.
                            - Conditional rendering for "No insights available" message if no
                              insights, not scanning, and no specific insight categories are
                              present.

**Usage Example:**

The `StyleScanner` component is designed to be used within a React application, likely as a primary
feature page.

1. **Import the component:**
    ```jsx
    import StyleScanner from './StyleScanner';
    ```
````

2. **Integrate into your application's component hierarchy:**

    ```jsx
    function App() {
        // ... other app logic and context providers (like UserContext) ...

        return (
            // ... layout components (Navbar, etc.) ...
            <StyleScanner />
            // ... layout components (BottomNavigationBar, etc.) ...
        );
    }
    ```

3. **User Interaction Flow:**
    - User navigates to the page where `StyleScanner` is rendered.
    - User clicks the "Upload Photo" button.
    - File selection dialog opens, and the user selects an outfit image.
    - The image preview is displayed.
    - User can adjust the "Analysis Depth" slider.
    - User can toggle the "Detailed Analysis™" switch (subscription may be required).
    - User clicks the "Scan Style" button.
    - "Scanning..." loading state is shown.
    - The component sends the image to the backend API for analysis.
    - Upon successful analysis, insights (outfit analysis, style score, recommendations, benefits)
      are displayed.
    - If there is an error, an error toast notification is shown.

**Project Context:**

- Located in `src\StyleScanner.jsx`, indicating it's a frontend component.
- Interacts with backend API endpoint `/api/generate-insight` defined by `API_URL` from `App.jsx`.
- Uses `UserContext` from `App.jsx` for subscription status, suggesting integration within a larger
  application with user authentication and subscription features.
- Leverages Chakra UI for styling, maintaining design consistency within the application.
- The component's functionality aligns with the likely purpose of the project structure, which
  appears to be a fashion/style analysis application.

This documentation provides a comprehensive overview of the `StyleScanner.jsx` component, its
functionality, internal workings, and how it fits within the broader project context.

```

```
