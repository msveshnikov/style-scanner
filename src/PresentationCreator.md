# PresentationCreator Component Documentation

This document provides a detailed description of the PresentationCreator component, located at
`src/PresentationCreator.jsx`. The component is responsible for generating PowerPoint presentations
based on user inputs and AI-generated content.

---

## Overview

The PresentationCreator is a React functional component that allows users to create PowerPoint
presentations (PPTX files) interactively. It features a UI for entering a presentation topic and
specifying the number of slides. When the form is submitted, the component:

• Sends a request to a backend API (using the provided `API_URL`) to generate AI-driven presentation
content.  
• Receives the presentation data which includes the title, description, slides, and themes.  
• Uses the [PptxGenJS](https://github.com/gitbrent/PptxGenJS) library to dynamically construct the
presentation slides.  
• Provides real-time notifications (via Chakra UI’s toast system) about the success or failure of
the presentation generation process.

This component is part of the front-end code within a project that also contains backend services
for AI processing and presentation schema definitions.

---

## Project Structure Context

The project is organized as follows:

```
.
├── .prettierrc
├── copy.cmd
├── docker-compose.yml
├── Dockerfile
├── index.html
├── landing.html
├── package.json
├── vite.config.js
├── src
│    ├── App.jsx
│    ├── Landing.jsx
│    ├── main.jsx
│    └── PresentationCreator.jsx   <-- (This file)
├── server
│    ├── claude.js
│    ├── gemini.js
│    ├── index.js
│    ├── package.json
│    ├── presentationSchema.json
│    └── models
│         ├── Presentation.js
│         └── User.js
├── public
│    ├── ads.txt
│    ├── landing.html
│    └── robots.txt
└── docs
     ├── landing_page_copy.html
     └── social_media_content.json
```

Within this structure, `PresentationCreator.jsx` resides in the `src` folder and handles the
front-end UI and presentation generation logic. It works in concert with backend endpoints (e.g.,
`/api/generate-presentation`) defined in the server directory.

---

## Dependencies

- **React**: Utilizes hooks like `useState` for state management.
- **Chakra UI**: Provides UI components such as Box, FormControl, FormLabel, Input, Button, VStack,
  and the `useToast` hook for notifications.
- **PptxGenJS**: A library for creating PowerPoint presentations in JavaScript.
- **API_URL**: A constant imported from `./App` that specifies the backend server’s URL for handling
  AI presentation generation.

---

## Component Structure

### State Variables

- **aiTopic (string)**  
  Stores the user-provided presentation topic.

- **aiNumSlides (number)**  
  Keeps track of the number of slides desired in the presentation (default is 10).

- **aiLoading (boolean)**  
  Indicates whether the AI presentation generation process is currently in progress. This state is
  used to trigger the loading state on the submit button.

- **toast**  
  Obtained from Chakra UI’s `useToast`, used to display notification messages for success or error
  events.

---

## Functions and Methods

### 1. generatePptxFromPresentation(pres)

**Description:**  
Generates a PowerPoint presentation (PPTX file) from the provided presentation data object using the
PptxGenJS library.

**Parameters:**

- `pres` (Object): The presentation object, expected to have the following properties:
    - **title** (string): The title of the presentation.
    - **description** (string, optional): An optional description.
    - **theme** (object, optional): Contains styling details such as `primaryColor` and
      `secondaryColor`.
    - **slides** (Array): An array of slide objects. Each slide object can have:
        - **title** (string): Title text for the slide.
        - **content** (string, optional): Central content for the slide.
        - **background** (string, optional): Defines the slide background. Can be a color in hex
          format or a path to an image.
        - **elements** (Array, optional): List of additional elements (text, images, lists, etc.) to
          add.
        - **notes** (string, optional): Presenter notes for the slide.

**Process:**

1. **Instantiate the PPTX generator:**  
   Creates a new `PptxGenJS` instance.

2. **Create the Title Slide:**

    - Adds a slide for the presentation title.
    - Places the title and, if available, the description text on the slide.
    - Applies styling based on the presentation’s theme.

3. **Iterate Through Slides:**  
   For each slide in `pres.slides`:

    - A new slide is added.
    - If a background is specified, it is applied as either a color fill (if starting with `#`) or
      as a background image.
    - The slide’s title is rendered.
    - If `slideData.content` is provided, it is added.
    - If special elements are defined in `slideData.elements`, they are loops through and rendered
      based on their type:
        - **text:** Rendered as simple text.
        - **image:** Rendered as an image using the specified path.
        - **list:** Rendered as a bulleted list.
        - **diagram, chart, process, timeline:** Rendered as a placeholder text with the element
          type mentioned.
        - **default:** If an unknown type is encountered, a default message is displayed.
    - If neither content nor elements are provided, a fallback message is added: "No content
      provided for this slide."
    - If slide notes are available, they are added to the slide.

4. **Write the PPT File:**
    - Attempts to write the generated presentation to a file named after the title (i.e.,
      `${pres.title}.pptx`).
    - Displays a success toast notification if the file is generated successfully.
    - If an error occurs during file writing, an error toast is displayed with the error message.

**Return Value:**  
Returns a Promise that resolves upon successful writing of the presentation file or rejects if an
error occurs. (The function does not explicitly return a value for further processing.)

---

### 2. handleGenerateAIPresentation(e)

**Description:**  
Handles the form submission event for generating an AI-driven presentation. It sends a request to
the backend, processes the response, and triggers PPTX generation.

**Parameters:**

- `e` (Event): The form submission event.

**Process:**

1. **Prevent Default Form Submission:**  
   Calls `e.preventDefault()` to stop the page from reloading.

2. **Set Loading State:**  
   Updates `aiLoading` to `true` to indicate the start of the generation process.

3. **API Call to Generate Presentation:**

    - Sends a POST request to `${API_URL}/api/generate-presentation` with a JSON body containing:
        - `topic`: The presentation topic provided by the user.
        - `numSlides`: The number of slides (converted to a number).
        - `model`: Hardcoded value (`'o3-mini'`), indicating which AI model to use.
        - `temperature`: Hardcoded value (`0.7`), controlling the creativity of the AI output.
    - Checks for response errors. If the response is not OK, extracts and throws an error from the
      JSON error payload.

4. **Process Response:**

    - Converts the response JSON into a presentation object.
    - Calls `generatePptxFromPresentation` with the received presentation data (ensuring the title
      is set using `result.topic`).

5. **Error Handling:**

    - If an error occurs at any point during the process, displays an error toast with the error
      message.

6. **Reset Loading State:**
    - In the `finally` block, sets `aiLoading` back to `false`, ensuring that the loading state is
      cleared regardless of success or failure.

**Return Value:**  
This function returns a Promise that fulfills after processing the API response and generating the
presentation. It does not explicitly return a value for external consumption.

---

## Rendered UI

The component returns the following JSX structure:

- **Container (Box):**  
  A responsive container with padding and a maximum width of 600 pixels, centered on the page.

- **Form (VStack):**  
  A vertical stack that serves as a form, containing:
    - **Presentation Topic Field (FormControl, Input):**  
      A required field where the user enters the topic of the presentation.
    - **Number of Slides Field (FormControl, Input):**  
      A required field that accepts a numeric value for the number of slides (between 1 and 30).
    - **Submit Button (Button):**  
      A button to generate the presentation. The button shows a loading indicator while the
      presentation is being generated.

Using Chakra UI components ensures that the interface is both visually appealing and accessible.

---

## Usage Example

Below is an example of how you might integrate the PresentationCreator component into your
application:

```jsx
// App.jsx
import React from 'react';
import { PresentationCreator } from './PresentationCreator';

function App() {
    return (
        <div>
            <h1>AI Presentation Generator</h1>
            <PresentationCreator />
        </div>
    );
}

export default App;
```

In this example, the PresentationCreator component is rendered within the main application
component. Users can interact with the form to generate PPTX files based on AI-generated
presentation content.

---

## Error Handling and Notifications

- **Toast Notifications:**  
  The component leverages Chakra UI’s `useToast` hook to communicate success and error messages to
  the user:

    - A success toast is shown when the PPTX file is generated and saved successfully.
    - Error toasts are displayed if the API call fails or if any errors are encountered during the
      PPT generation process.

- **Loading State:**  
  The `aiLoading` state triggers the loading spinner on the submit button, visually indicating to
  the user that the generation process is underway.

---

## Conclusion

The PresentationCreator component encapsulates the logic for:

- Collecting presentation parameters from the user (topic and slide count).
- Calling a backend service to generate AI-powered presentation content.
- Dynamically constructing a PowerPoint presentation using PptxGenJS.
- Delivering real-time user feedback through toast notifications.

This component is an integral part of a broader project that includes server-side AI processing and
presentation schema management, making it a robust solution for on-demand presentation generation.

Feel free to refer back to this documentation as you modify or extend the functionality of the
PresentationCreator component.
