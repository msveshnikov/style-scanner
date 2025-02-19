import OpenAI from 'openai';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { getUnsplashImage } from './imageService.js';

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

const extractCodeSnippet = (text) => {
    const codeBlockRegex = /```(?:json|js|html)?\n([\s\S]*?)\n```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1] : text;
};

const analyzeFood = async (description) => {
    const prompt = `Analyze the following food description and return detailed nutritional (and emoji!) information in JSON format:
"${description}"
Include: calories, protein, carbs, fat, fiber, vitamins (A, B1, B3, B6, B12, C, D) where vitamins are expressed as a percentage of recommended daily intake.
Return just JSON, no text.
Format as:
{
  calories: number,
  mealType: string,
  emoji: string,
  macros: {
    protein: number,
    carbs: number,
    fats: number,
    fiber: number
  },
  vitamins: {
    A: number,
    B1: number, 
    B3: number,
    B6: number,
    B12: number,
    C: number,
    D: number
  }
}`;
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
    });
    return JSON.parse(extractCodeSnippet(completion.choices[0]?.message?.content));
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

const analyzeFoodImage = async (base64Image) => {
    const messages = [
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: `Analyze this food image and return detailed nutritional information  (and emoji!) in JSON format.
Include: foodName, calories, protein, carbs, fat, fiber, vitamins (A, B1, B3, B6, B12, C, D) where vitamins are expressed as a percentage of recommended daily intake.
Return just JSON, no text.
Format as:
{
  foodName: string,
  calories: number,
  mealType: string,
  emoji: string,
  macros: {
    protein: number,
    carbs: number,
    fats: number,
    fiber: number
  },
  vitamins: {
    A: number,
    B1: number, 
    B3: number,
    B6: number,
    B12: number,
    C: number,
    D: number
  }
}`
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

const calculateCalorieNeeds = async (user) => {
    const prompt = `Calculate daily calorie needs for:
Height: ${user?.bodyMetrics.height} cm
Weight: ${user?.bodyMetrics.weight} kg
Age: ${user?.bodyMetrics.age} years
Gender: ${user?.bodyMetrics.gender}
Activity Level: ${user?.bodyMetrics.activityLevel}
Return just the number of kcal/day as an integer without any prefix or suffix!`;
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
    });
    return parseInt(completion.choices[0]?.message?.content);
};

const generateMealPlan = async (user, language = 'en') => {
    const prompt = `Generate a 7-day meal plan based on:
User Profile: ${JSON.stringify(user?.bodyMetrics)}
Fitness Goals: ${JSON.stringify(user?.fitnessGoals)}
Include: 3 meals and 2 snacks per day with calorie and macro breakdown.
Include a featured dish image placeholder for each day in the format ![DishName](dishname.jpg).
Return the meal plan in rich markdown format in Language: ${language}.
`;
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
    });
    const mealPlanRaw = completion.choices[0]?.message?.content;
    return await replaceImagePlaceholders(mealPlanRaw, language);
};

const getNutritionInsights = async (foodLogs, language = 'en') => {
    const prompt = `Analyze food logs and provide insights in Language: ${language}:
${JSON.stringify(foodLogs)}
Include: macro balance, vitamin levels expressed as percentages of recommended daily intake, improvements, recommendations.
Do not include tables. Just provide insights.
Return in rich md format.`;
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1300
    });
    return completion.choices[0]?.message?.content;
};

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const replaceImagePlaceholders = async (text, language) => {
    const imageRegex = /!\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let result = text;
    const processedUrls = new Set();

    while ((match = imageRegex.exec(text)) !== null) {
        const [fullMatch, altText] = match;
        if (!processedUrls.has(fullMatch)) {
            const imageUrl = await getUnsplashImage(altText, language);
            if (imageUrl) {
                result = result.replace(
                    new RegExp(escapeRegExp(fullMatch), 'g'),
                    `![${altText}](${imageUrl})`
                );
            }
            processedUrls.add(fullMatch);
        }
    }
    return result;
};

export {
    analyzeFood,
    analyzeFoodImage,
    calculateCalorieNeeds,
    generateMealPlan,
    getNutritionInsights
};
