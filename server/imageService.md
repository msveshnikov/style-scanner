# Image Service Documentation

This document provides a comprehensive overview of the functionality implemented in the file
`server/imageService.js`. This module is responsible for integrating with external APIs (Unsplash,
Google Images, and OpenAI) to retrieve and process images based on a textual prompt. It also
provides a utility to translate text when needed and to replace placeholder graphics in a
presentation with actual image URLs.

---

## Table of Contents

- [Overview](#overview)
- [Dependencies and Configuration](#dependencies-and-configuration)
- [Exported Functions](#exported-functions)
    - [getText](#gettext)
    - [googleImages](#googleimages)
    - [getRandomUserAgent](#getrandomuseragent)
    - [getUnsplashImage](#getunsplashimage)
    - [getGoogleImage](#getgoogleimage)
    - [replaceGraphics](#replacegraphics)
- [Usage Examples](#usage-examples)
- [Project Integration](#project-integration)
- [Error Handling and Considerations](#error-handling-and-considerations)

---

## Overview

The `imageService.js` module plays a central role on the server-side by providing utilities to:

- Generate or transform text using the OpenAI API.
- Retrieve images based on a search term from two image sources:
    - Unsplash (via their public API)
    - Google Images (by scraping HTML)
- Replace graphic elements in a presentation object with fetched image URLs.

This module is designed to be part of a larger project that includes a UI for creating presentations
(e.g., the `PresentationCreator.jsx` component in the `src` folder) and several other server-side
modules.

---

## Dependencies and Configuration

This module relies on the following external libraries:

- **node-fetch**: For making HTTP requests.
- **openai**: For interacting with OpenAI's API (e.g., generating text or translations).
- **dotenv**: For loading environment variables from a `.env` file.
- **cheerio**: For parsing and querying the HTML response from Google Images.

### Environment Variables

Before using this module, ensure that the following variables are set (typically in a `.env` file):

- `OPENAI_KEY`: Your API key for the OpenAI service.
- `UNSPLASH_API_KEY`: Your API key for accessing the Unsplash API.

These are loaded at runtime using the `dotenv` package:

```js
import dotenv from 'dotenv';
dotenv.config(true);
```

---

## Exported Functions

### getText

**Description:**  
Generates text using OpenAI's Chat API based on a given prompt. This function may be used, for
instance, to translate text to English if required.

**Parameters:**

- `prompt` (string): The text prompt for which a response is needed.
- `model` (string, optional): The model identifier to use for generating text. Default is
  `'gpt-4o-mini'`.
- `temperature` (number, optional): Sampling temperature for response randomness. Default is `0.5`.

**Return Value:**  
A Promise that resolves to a string containing the generated text from the OpenAI response
(extracted from the first message choice).

**Example:**

```js
import { getText } from './server/imageService.js';

const prompt = 'What is the capital of France?';
getText(prompt).then((response) => {
    console.log(response); // Expected output: "Paris" (or similar based on the OpenAI response)
});
```

---

### googleImages

**Description:**  
Fetches image results from Google Images by scraping the HTML response. It constructs a query URL
with the search term and uses a randomized User-Agent header to avoid being easily blocked by
Google.

**Parameters:**

- `term` (string): The search term (query) for which images are to be retrieved.

**Return Value:**  
A Promise that resolves to an array of objects. Each object has an `image` property containing the
image URL extracted from the HTML.

**Example:**

```js
import { googleImages } from './server/imageService.js';

googleImages('beautiful landscapes').then((images) => {
    console.log(images);
});
```

---

### getRandomUserAgent

**Description:**  
Selects and returns a random User-Agent string from a pre-defined list. This is used to randomize
the HTTP request header for image fetching from Google Images.

**Return Value:**  
A string representing a User-Agent.

**Example:**

```js
import { getRandomUserAgent } from './server/imageService.js';

const userAgent = getRandomUserAgent();
console.log(userAgent); // Outputs one of the predefined User-Agent strings
```

---

### getUnsplashImage

**Description:**  
Retrieves an image URL from Unsplash using the Unsplash API. This function processes the input
prompt (trimming it and translating it if the language isn’t English), makes a request to Unsplash,
and returns a random image URL from the results. If the Unsplash API fails or no images are found,
it falls back to retrieving an image from Google Images.

**Parameters:**

- `prompt` (string): The search query for the desired image.
- `language` (string): The language code of the prompt. If not `'en'`, the prompt is translated
  using the OpenAI API.

**Return Value:**  
A Promise that resolves to a string URL for the image. If no image is found (or in case of an
error), it attempts to fetch from Google Images.

**Example:**

```js
import { getUnsplashImage } from './server/imageService.js';

getUnsplashImage('cielo atardecer', 'es')
    .then((url) => {
        console.log(url); // Outputs the URL of an image from Unsplash (translated if necessary)
    })
    .catch((error) => {
        console.error('Error fetching image:', error);
    });
```

---

### getGoogleImage

**Description:**  
A fallback method that requests images from Google Images if Unsplash fails. It calls the
`googleImages` function to obtain an array of images, randomly selects one, and returns its URL.

**Parameters:**

- `prompt` (string): The search term for retrieving the image.

**Return Value:**  
A Promise that resolves to a string containing the image URL. In failure cases, it returns either an
object with `url: null` and an empty `credits` array or `null`.

**Example:**

```js
import { getGoogleImage } from './server/imageService.js';

getGoogleImage('sunset').then((url) => {
    console.log(url); // Outputs the URL of an image from Google Images
});
```

---

### replaceGraphics

**Description:**  
Processes a presentation object by iterating through its slides and elements. For each element of
type `'graphic'` or `'image'`, this function fetches a new image URL (using `getUnsplashImage`) and
replaces the element's content with this URL. This is useful for dynamically updating presentations
with high-quality imagery.

**Parameters:**

- `presentation` (object): The presentation object. It should contain a property `slides`, which is
  an array. Each slide should have an `elements` array.
- `language` (string): The language code for the text content. This is used to determine if
  translation is necessary before querying for images.

**Return Value:**  
A Promise that resolves to the updated presentation object with replaced graphics.

**Example:**

```js
import { replaceGraphics } from './server/imageService.js';

const presentation = {
    slides: [
        {
            elements: [
                { type: 'text', content: 'Welcome' },
                { type: 'graphic', content: 'sunrise over mountains' }
            ]
        },
        {
            elements: [{ type: 'image', content: 'city skyline at night' }]
        }
    ]
};

replaceGraphics(presentation, 'en').then((updatedPresentation) => {
    console.log(updatedPresentation);
    // The graphic and image elements will have their content replaced with new image URLs.
});
```

---

## Usage Examples

### Example: Translating and Retrieving an Unsplash Image

Suppose you have a non-English prompt and you wish to obtain an image URL:

```js
import { getUnsplashImage } from './server/imageService.js';

async function fetchImage() {
    // A Spanish description that needs translation before the Unsplash search
    const prompt = 'atardecer en la playa con palmeras';
    const language = 'es'; // non-English

    try {
        const imageURL = await getUnsplashImage(prompt, language);
        console.log('Fetched image URL:', imageURL);
    } catch (error) {
        console.error('Error fetching image:', error);
    }
}

fetchImage();
```

### Example: Updating Presentation Graphics

If you have a presentation object that contains placeholder text for images, you can update it as
follows:

```js
import { replaceGraphics } from './server/imageService.js';

async function updatePresentationGraphics(presentation, language) {
    const updatedPresentation = await replaceGraphics(presentation, language);
    // Now the presentation elements of type 'graphic' or 'image' contain actual image URLs.
    console.log('Updated Presentation:', updatedPresentation);
}

// Example presentation object:
const presentation = {
    slides: [
        {
            elements: [
                { type: 'graphic', content: 'forest trail in autumn' },
                { type: 'text', content: 'This is a sample slide' }
            ]
        }
    ]
};

updatePresentationGraphics(presentation, 'en');
```

---

## Project Integration

Within the overall project structure, this file is located in the `server` directory alongside other
modules (e.g., `claude.js`, `gemini.js`, and the main `index.js`). Its responsibilities include:

- Serving image-related requests from the front-end (e.g., via a REST API).
- Being used as a utility by presentation processing modules (as seen with `replaceGraphics`).
- Providing a fallback mechanism (via `getGoogleImage`) in case one image provider fails.

The related front-end components (found in the `src` folder) such as `PresentationCreator.jsx` are
likely to trigger calls to these functions when a user creates or updates a presentation.

---

## Error Handling and Considerations

- **Network Requests:**  
  All external API calls are performed asynchronously. If an API call (to Unsplash or Google Images)
  fails or returns a non-OK status, the code throws an error which is caught and logged.

- **Fallback Logic:**  
  The `getUnsplashImage` function is designed to fall back on `getGoogleImage` if the Unsplash API
  fails or returns no results.

- **User-Agent Randomization:**  
  The `googleImages` function uses a randomized User-Agent to reduce the risk of being blocked when
  scraping Google Images.

- **Text Translation:**  
  If the input language is not English, the module uses the OpenAI API to translate the prompt
  before making image queries. Keep in mind that this adds an extra API call, which can affect
  performance and API usage quotas.

---

## Conclusion

The `server/imageService.js` module is a key component of the project's backend, enabling dynamic
image retrieval and processing. It interfaces with multiple external services to ensure that
presentations are enriched with high-quality imagery. Be sure to configure the necessary environment
variables and handle API errors gracefully when integrating this module into your application.

Happy coding!
