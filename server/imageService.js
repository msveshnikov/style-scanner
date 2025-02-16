import fetch from 'node-fetch';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { load } from 'cheerio';

dotenv.config(true);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

export const getText = async (prompt, model = 'gpt-4o-mini', temperature = 0.5) => {
    const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature
    });
    return completion.choices[0]?.message?.content;
};

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

export const googleImages = async (term) => {
    const result = await fetch(
        `https://www.google.com/search?s=images&udm=2&q=${encodeURIComponent(term)}&gl=us&asearch=arc&async=arc_id:srp_110,ffilt:all,ve_name:MoreResultsContainer,use_ac:false,inf:1,_id:arc-srp_110,_pms:s,_fmt:pc`,
        {
            headers: { 'User-Agent': getRandomUserAgent() }
        }
    );
    const $ = load(await result.text());
    const images = [];

    $('.H8Rx8c').each((i, el) => {
        const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        if (image) {
            images.push({ image });
        }
    });

    return images;
};

export const getUnsplashImage = async (prompt) => {
    try {
        console.log('Searching unsplash for image:', prompt);
        prompt = prompt.substring(0, 50);
        const translated = await getText(
            'Translate sentences in brackets [] into English:\n[' + prompt + ']\n'
        );
        if (translated) {
            prompt = translated;
        }
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt)}&orientation=landscape&client_id=${process.env.UNSPLASH_API_KEY}`
        );
        if (!response.ok) {
            throw new Error('Unsplash API error:' + response.status);
        }
        const data = await response.json();
        const index = Math.floor(Math.random() * Math.min(data.results.length, 10));
        const imageData = data.results[index];
        if (!imageData) {
            throw new Error('No images found');
        }
        return imageData.urls.small;
    } catch (e) {
        console.error(e);
        console.log('Googling');
        return getGoogleImage(prompt);
    }
};

export const getGoogleImage = async (prompt) => {
    try {
        console.log('Searching Google for image:', prompt);
        const images = await googleImages(prompt, 'en');
        const randomImage = images[Math.floor(Math.random() * images.length)];
        if (!randomImage?.image) {
            return { url: null, credits: [] };
        }
        return randomImage.image;
    } catch {
        return null;
    }
};

export const replaceGraphics = async (presentation, imageSource) => {
    if (presentation && Array.isArray(presentation.slides)) {
        for (const slide of presentation.slides) {
            if (Array.isArray(slide.elements)) {
                for (const element of slide.elements) {
                    if (element.type === 'graphic' || element.type === 'image') {
                        const imageUrl =
                            imageSource !== 'google'
                                ? await getUnsplashImage(element.content)
                                : await getGoogleImage(element.content);
                        if (imageUrl) {
                            element.content = imageUrl;
                        }
                    }
                }
            }
        }
    }
    return presentation;
};
