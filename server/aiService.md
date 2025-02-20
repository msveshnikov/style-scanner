# File Documentation: server/aiService.js

## Overview

This file, `aiService.js`, is located in the `server` directory of the project and is responsible
for handling interactions with OpenAI's API. It provides functionalities for:

- **Text Generation:** Using OpenAI's chat completion models to generate text based on provided
  prompts.
- **Fashion Image Analysis:** Leveraging OpenAI's vision capabilities to analyze fashion styles in
  images and provide feedback based on a predefined schema and optional style preferences.
- **Image Resizing:** Optimizing images before sending them to the OpenAI API by resizing them to a
  maximum size using the `sharp` library.

This file serves as a crucial backend component for features that require AI-powered text and image
analysis, likely used by other server-side modules and potentially exposed through API endpoints to
be consumed by the frontend React application (specifically components like `StyleScanner.jsx` in
the `src` directory).

It utilizes environment variables (configured via `dotenv`) to securely manage the OpenAI API key
and reads a JSON schema (`outfitSchema.json`) to structure the output of fashion image analysis.

## Function/Method Descriptions

### 1. `getText(prompt, model = 'gpt-4o-mini', temperature = 0.5)`

**Description:** This asynchronous function interacts with the OpenAI API to generate text based on
a given prompt. It uses the chat completion endpoint and allows customization of the model and
temperature parameters.

**Parameters:**

- `prompt` (string): The text prompt to be sent to the OpenAI model. This is the input that guides
  the AI's text generation.
- `model` (string, optional): The name of the OpenAI chat completion model to use. Defaults to
  `'gpt-4o-mini'`. You can specify other models available in the OpenAI API.
- `temperature` (number, optional): Controls the randomness of the generated text. A value closer to
  0 makes the output more deterministic and focused, while a value closer to 1 makes it more random
  and creative. Defaults to `0.5`.

**Return Value:**

- `Promise<string | undefined>`: A Promise that resolves with the generated text content from the
  OpenAI model as a string. Returns `undefined` if there's an issue retrieving the content from the
  API response.

**Usage Example:**

```javascript
import { getText } from './aiService.js';

async function generateSummary() {
    const summaryPrompt = 'Summarize the plot of Hamlet in three sentences.';
    try {
        const summary = await getText(summaryPrompt);
        console.log('Generated Summary:', summary);
    } catch (error) {
        console.error('Error generating text:', error);
    }
}

generateSummary();
```

### 2. `extractCodeSnippet(text)`

**Description:** This function is a helper function used internally to extract code snippets from a
text string. It specifically looks for code blocks enclosed in triple backticks
(`````) and optionally recognizes language specifiers like `json`, `js`, or `html`. If a code block
is found, it extracts the code content; otherwise, it returns the original text.

**Parameters:**

- `text` (string): The text string potentially containing a code snippet enclosed in backticks.

**Return Value:**

- `string`: The extracted code snippet (if found within backticks) or the original input `text` if
  no code block is detected.

**Usage Example:**

```javascript
import { extractCodeSnippet } from './aiService.js';

const textWithCode = `
This is some text before a code block.
\`\`\`json
{
  "name": "example",
  "value": 123
}
\`\`\`
And some text after.
`;

const codeSnippet = extractCodeSnippet(textWithCode);
console.log('Extracted Code:', codeSnippet);
// Output:
// Extracted Code:
// {
//   "name": "example",
//   "value": 123
// }

const textWithoutCode = 'This is just plain text.';
const plainTextResult = extractCodeSnippet(textWithoutCode);
console.log('No Code Extracted:', plainTextResult);
// Output:
// No Code Extracted: This is just plain text.
```

**Note:** This function is not exported and is intended for internal use within `aiService.js`,
specifically to process the output from OpenAI which might be formatted in Markdown with code
blocks.

### 3. `resizeImage(imageBase64, maxSize = 512 * 512)`

**Description:** This asynchronous function resizes a base64 encoded image if its size exceeds a
specified maximum size. It uses the `sharp` library for image processing. The function ensures that
images sent to the OpenAI API are within reasonable size limits, potentially improving performance
and reducing API costs.

**Parameters:**

- `imageBase64` (string): A base64 encoded string representing the image data.
- `maxSize` (number, optional): The maximum allowed size of the image in bytes. Defaults to
  `512 * 512` bytes.

**Return Value:**

- `Promise<string>`: A Promise that resolves with a base64 encoded string of the (potentially
  resized) image. If the original image size is already within the `maxSize` limit, it returns the
  original `imageBase64` string.

**Usage Example:**

```javascript
import { resizeImage } from './aiService.js';
import fs from 'fs';

async function processImage() {
    const imagePath = './path/to/your/image.jpg'; // Replace with your image path
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    try {
        const resizedBase64 = await resizeImage(base64Image);
        console.log('Resized Image Base64:', resizedBase64.substring(0, 50) + '...'); // Print first 50 chars
        // You can then use resizedBase64 for further processing, like sending to OpenAI API
    } catch (error) {
        console.error('Error resizing image:', error);
    }
}

processImage();
```

### 4. `analyzeFashionImage(base64Image, stylePreferences)`

**Description:** This asynchronous function analyzes a fashion image provided as a base64 string
using OpenAI's vision capabilities. It sends the image and a prompt to the OpenAI chat completion
API, requesting fashion style analysis and feedback based on a predefined JSON schema
(`outfitSchema.json`) and optional style preferences provided by the user.

**Parameters:**

- `base64Image` (string): A base64 encoded string representing the fashion image to be analyzed.
- `stylePreferences` (string, optional): A string containing user's style preferences. This will be
  included in the prompt to guide the AI's analysis, allowing for personalized feedback.

**Return Value:**

- `Promise<object>`: A Promise that resolves with a JavaScript object representing the fashion
  analysis result. This object is parsed from the JSON response received from the OpenAI API and is
  expected to conform to the structure defined in `outfitSchema.json`.

**Usage Example:**

```javascript
import { analyzeFashionImage } from './aiService.js';
import fs from 'fs';

async function analyzeImage() {
    const imagePath = './path/to/your/fashion_image.jpg'; // Replace with your fashion image path
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const userStylePreferences = 'I prefer minimalist and modern styles.';

    try {
        const analysisResult = await analyzeFashionImage(base64Image, userStylePreferences);
        console.log('Fashion Analysis Result:', analysisResult);
        // Access specific analysis details from the result object, e.g., analysisResult.outfitAnalysis
    } catch (error) {
        console.error('Error analyzing fashion image:', error);
    }
}

analyzeImage();
```

## Project Context and Dependencies

- **Project Location:** `server/aiService.js` - Indicates this file is part of the backend server
  logic.
- **Dependencies:**
    - `openai`: Official OpenAI Node.js library for interacting with the OpenAI API.
    - `dotenv`: Used to load environment variables from a `.env` file (though `dotenv.config(true)`
      might be overly aggressive and should be reviewed for specific needs). This is crucial for
      managing the `OPENAI_KEY` securely.
    - `sharp`: A high-performance Node.js module for image processing, used here for resizing
      images.
    - `fs` (File System module from Node.js): Used to read the `outfitSchema.json` file.
    - `path` (Path module from Node.js): Used for constructing file paths, specifically to locate
      `outfitSchema.json`.
    - `url` (URL module from Node.js): Used to get the directory name (`__dirname`) in ES modules.
- **Configuration:**
    - **`.env` file:** Expected to contain `OPENAI_KEY` environment variable with your OpenAI API
      key.
    - **`outfitSchema.json`:** Located in the same `server` directory, this file defines the JSON
      schema for the fashion analysis results. This schema dictates the structure of the JSON object
      returned by the `analyzeFashionImage` function, ensuring consistency and predictability in the
      data.
- **Role in Project:** This file is a core service within the backend, providing AI functionalities
  to the application. It likely interacts with other server-side components (e.g., API endpoints
  defined in `index.js` or other server files) to provide features to the frontend application.
  Components like `StyleScanner.jsx` in the frontend would likely utilize API endpoints that in turn
  call functions from this `aiService.js` file.

This documentation provides a comprehensive overview of the `aiService.js` file, its functions, and
its role within the larger project. Developers can use this documentation to understand how to use
the AI functionalities and integrate them into other parts of the application.

```

```
