import express from 'express';
import cors from 'cors';
import fs from 'fs';
import promBundle from 'express-prom-bundle';
import { promises as fsPromises } from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import morgan from 'morgan';
import compression from 'compression';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getTextGemini } from './gemini.js';
import User from './models/User.js';
import Insight from './models/Insight.js';
import { replaceGraphics } from './imageService.js';
import { getTextGpt } from './openai.js';
import userRoutes from './user.js';
import Feedback from './models/Feedback.js';
import { authenticateToken, authenticateTokenOptional } from './middleware/auth.js';
import adminRoutes from './admin.js';
// import { getTextDeepseek } from './deepseek.js';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;
app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe-webhook') {
        next();
    } else {
        express.json({ limit: '15mb' })(req, res, next);
    }
});
const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    customLabels: { model: 'No' },
    transformLabels: (labels, req) => {
        labels.model = req?.body?.model ?? 'No';
        return labels;
    }
});
app.use(metricsMiddleware);
app.use(cors());
app.use(express.static(join(__dirname, '../dist')));
app.use(morgan('dev'));
app.use(compression());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 130
});
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', limiter);
}
mongoose.connect(process.env.MONGODB_URI, {});
userRoutes(app);
adminRoutes(app);
const generateAIResponse = async (prompt, model, temperature = 0.7) => {
    switch (model) {
        // case 'o3-mini':
        case 'gpt-4o-mini': {
            return await getTextGpt(prompt, model, temperature);
        }
        // case 'gemini-2.0-pro-exp-02-05':
        case 'gemini-2.0-flash-001':
        case 'gemini-2.0-flash-thinking-exp-01-21':
            return await getTextGemini(prompt, model, temperature);
        // case 'deepseek-reasoner':
        //     return await getTextDeepseek(prompt, model, temperature);
        default:
            throw new Error('Invalid model specified');
    }
};

export const checkAiLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (
            user &&
            user.subscriptionStatus !== 'active' &&
            user.subscriptionStatus !== 'trialing'
        ) {
            const now = new Date();
            if (user.lastAiRequestTime) {
                const lastRequest = new Date(user.lastAiRequestTime);
                if (now.toDateString() === lastRequest.toDateString()) {
                    if (user.aiRequestCount >= 13) {
                        return res
                            .status(429)
                            .json({ error: 'Daily AI request limit reached, please upgrade' });
                    }
                    user.aiRequestCount++;
                } else {
                    user.aiRequestCount = 1;
                    user.lastAiRequestTime = now;
                }
            } else {
                user.lastAiRequestTime = now;
                user.aiRequestCount = 1;
            }
            await user.save();
        }
        next();
    } catch (err) {
        next(err);
    }
};

const extractCodeSnippet = (text) => {
    const codeBlockRegex = /```(?:json|js|html)?\n([\s\S]*?)\n```/;
    const match = text.match(codeBlockRegex);
    return match ? match[1] : text;
};

app.post('/api/generate-insight', authenticateToken, checkAiLimit, async (req, res) => {
    try {
        let { imageSource, stylePreferences, model, temperature } = req.body;
        if (!imageSource) {
            return res.status(400).json({ error: 'Image source is required' });
        }
        temperature = temperature || 0.7;
        const outfitSchema = JSON.parse(
            fs.readFileSync(join(__dirname, 'outfitSchema.json'), 'utf8')
        );
        let prompt = `Analyze the outfit depicted in the image provided below. Provide detailed and actionable fashion insights including an outfit analysis, style recommendations, and clear benefits of the suggestions.\nReturn everything in one JSON with schema: ${JSON.stringify(outfitSchema)}`;
        if (stylePreferences) {
            prompt += ` User style preferences: ${stylePreferences}.`;
        }
        prompt += `\nImage Source: ${imageSource}`;
        const result = await generateAIResponse(prompt, model, temperature);
        if (!result) {
            throw new Error('No response from model, please try again later');
        }
        let parsed;
        try {
            parsed = JSON.parse(extractCodeSnippet(result));
        } catch (e) {
            console.error(e);
            return res
                .status(500)
                .json({ error: 'Failed to parse AI response as JSON, please try again' });
        }
        parsed = await replaceGraphics(parsed, imageSource);
        const insightRecord = new Insight({
            title: 'Fashion Insight',
            photo: imageSource,
            recommendations: parsed.recommendations || '',
            userId: req.user.id,
            benefits: parsed.benefits || [],
            analysis: parsed,
            styleScore: 0
        });
        await insightRecord.save();
        res.status(201).json(parsed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/myinsights', authenticateToken, async (req, res) => {
    try {
        const search = req.query.search;
        let query = { userId: req.user.id };
        if (search) {
            query = {
                $and: [
                    query,
                    {
                        $or: [
                            { title: { $regex: search, $options: 'i' } },
                            { recommendations: { $regex: search, $options: 'i' } },
                            { 'analysis.outfitAnalysis': { $regex: search, $options: 'i' } }
                        ]
                    }
                ]
            };
        }
        const insights = await Insight.find(query);
        const limitedInsights = insights.map((insight) => ({
            _id: insight._id,
            title: insight.title,
            photo: insight.photo,
            recommendations: insight.recommendations,
            benefits: insight.benefits,
            analysis: insight.analysis,
            styleScore: insight.styleScore,
            createdAt: insight.createdAt,
            updatedAt: insight.updatedAt
        }));
        res.status(200).json(limitedInsights);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/insights/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        let insight = null;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            insight = await Insight.findById(identifier);
        }
        if (!insight) return res.status(404).json({ error: 'Insight not found' });
        res.status(200).json(insight);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/feedback', authenticateTokenOptional, async (req, res) => {
    try {
        const { message, type } = req.body;
        const feedback = new Feedback({
            userId: req?.user?.id,
            message,
            type,
            createdAt: new Date()
        });
        await feedback.save();
        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const event = await stripe.webhooks.constructEventAsync(
            req.body,
            req.headers['stripe-signature'],
            process.env.STRIPE_WH_SECRET
        );
        console.log('✅ Success:', event.id);
        switch (event.type) {
            case 'customer.subscription.updated':
            case 'customer.subscription.created':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                console.log(subscription);
                const customer = await stripe.customers.retrieve(subscription.customer);
                const user = await User.findOneAndUpdate(
                    { email: customer.email },
                    {
                        subscriptionStatus: subscription.status,
                        subscriptionId: subscription.id
                    }
                );
                if (!user) {
                    console.error(`User not found for email ${customer.email}`);
                    break;
                }
                const measurement_id = `G-00FKSX54XW`;
                const api_secret = process.env.GA_API_SECRET;
                fetch(
                    `https://www.google-analytics.com/mp/collect?measurement_id=${measurement_id}&api_secret=${api_secret}`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            client_id: '123456.7654321',
                            user_id: user._id,
                            events: [
                                {
                                    name: 'purchase',
                                    params: {
                                        subscriptionStatus: subscription.status,
                                        subscriptionId: subscription.id
                                    }
                                }
                            ]
                        })
                    }
                );
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    } catch (error) {
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

app.get('/api/docs', async (req, res) => {
    try {
        const search = req.query.search ? req.query.search.toLowerCase() : '';
        const categoryQuery =
            req.query.category && req.query.category !== 'all'
                ? req.query.category.toLowerCase()
                : null;
        const docsPath = join(__dirname, '../docs');
        const filenames = await fsPromises.readdir(docsPath);
        const docsData = await Promise.all(
            filenames.map(async (filename) => {
                const filePath = join(docsPath, filename);
                const content = await fsPromises.readFile(filePath, 'utf8');
                const title = filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
                const category = 'general';
                return { title, category, content, filename };
            })
        );
        let filteredDocs = docsData;
        if (categoryQuery) {
            filteredDocs = filteredDocs.filter(
                (doc) =>
                    doc.category.toLowerCase().includes(categoryQuery) ||
                    doc.filename.toLowerCase().includes(categoryQuery)
            );
        }
        if (search) {
            filteredDocs = filteredDocs.filter(
                (doc) =>
                    doc.title.toLowerCase().includes(search) ||
                    doc.content.toLowerCase().includes(search)
            );
        }
        res.json(filteredDocs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/sitemap.xml', async (req, res) => {
    try {
        const insights = await Insight.find();
        const staticRoutes = [
            '/',
            '/research',
            '/insights',
            '/privacy',
            '/terms',
            '/login',
            '/signup',
            '/forgot',
            '/profile',
            '/feedback',
            '/admin',
            '/docs'
        ];
        let urls = staticRoutes
            .map((route) => `<url><loc>https://StyleScanner.vip${route}</loc></url>`)
            .join('');
        insights.forEach((p) => {
            urls += `<url><loc>https://StyleScanner.vip/insight/${p._id}</loc></url>`;
        });
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.get('/', async (req, res) => {
    const html = fs.readFileSync(join(__dirname, '../dist/landing.html'), 'utf8');
    res.send(html);
});
app.get('*', async (req, res) => {
    const html = fs.readFileSync(join(__dirname, '../dist/index.html'), 'utf8');
    res.send(html);
});
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
process.on('uncaughtException', (err, origin) => {
    console.error(`Caught exception: ${err}`, `Exception origin: ${origin}`);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = './google.json';
