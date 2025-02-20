import OpenAI from 'openai';
import dotenv from 'dotenv';
import sharp from 'sharp';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config(true);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const extractCodeSnippet = (text) => {
    console.log(text);
    const codeBlockRegex = /```(?:json|js|html)?\n([\s\S]*?)\n```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1] : text;
};

const resizeImage = async (imageBase64, maxSize = 512 * 512) => {
    const image = sharp(Buffer.from(imageBase64, 'base64'));
    const metadata = await image.metadata();
    if (metadata.size > maxSize) {
        const resizedBuffer = await image
            .resize({
                fit: 'inside',
                withoutEnlargement: true,
                withMetadata: true
            })
            .toBuffer();
        return resizedBuffer.toString('base64');
    } else {
        return imageBase64;
    }
};

const analyzeFashionImage = async (base64Image, stylePreferences) => {
    const outfitSchema = JSON.parse(fs.readFileSync(join(__dirname, 'outfitSchema.json'), 'utf8'));

    let promptText = `Analyze the fashion style in this image and provide detailed feedback. Focus on outfit analysis, style recommendations, and benefits of the suggestions. Return the analysis in JSON format.
    Return everything in one JSON with schema: ${JSON.stringify(outfitSchema)}`;
    if (stylePreferences) {
        promptText += `Consider these style preferences: ${stylePreferences}.`;
    }

    const messages = [
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: promptText
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:image/jpeg;base64,${await resizeImage(base64Image)}`
                    }
                }
            ]
        }
    ];
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages
    });
    return JSON.parse(extractCodeSnippet(completion.choices[0]?.message?.content));
};

export { analyzeFashionImage, resizeImage };
