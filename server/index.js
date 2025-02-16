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
import Presentation from './models/Presentation.js';
import { replaceGraphics } from './imageService.js';
import { getTextGpt } from './openai.js';
import userRoutes from './user.js';
import Feedback from './models/Feedback.js';
import { authenticateToken, authenticateTokenOptional } from './middleware/auth.js';
import adminRoutes from './admin.js';
import { getTextDeepseek } from './deepseek.js';
import { fetchSearchResults, searchWebContent } from './search.js';
import { enrichMetadata } from './utils.js';

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
        case 'o3-mini':
        case 'gpt-4o-mini': {
            return await getTextGpt(prompt, model, temperature);
        }
        case 'gemini-2.0-pro-exp-02-05':
        case 'gemini-2.0-flash-001':
        case 'gemini-2.0-flash-thinking-exp-01-21':
            return await getTextGemini(prompt, model, temperature);
        case 'deepseek-reasoner':
            return await getTextDeepseek(prompt, model, temperature);
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
                    if (user.aiRequestCount >= 3) {
                        return res
                            .status(429)
                            .json({ error: 'Daily presentation limit reached, please upgrade' });
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
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};

app.post('/api/generate-presentation', authenticateToken, checkAiLimit, async (req, res) => {
    try {
        let { topic, numSlides, model, temperature, deepResearch, imageSource } = req.body;
        console.log(topic, numSlides, model, temperature, deepResearch, imageSource);
        topic = topic.substring(0, 1000);
        numSlides = numSlides || 10;
        model = model || 'o3-mini';
        temperature = temperature || 0.7;
        const user = await User.findById(req.user.id);
        const exampleSchema = fs.readFileSync(join(__dirname, 'presentationSchema.json'), 'utf8');
        const preferencesSummary = `
          Slide Layout: ${user.presentationSettings.slideLayout || 'standard'},
          Theme: ${user.presentationSettings.theme || 'light'}`;
        const webSearchContent = await fetchSearchResults(topic);
        let webContent = '';
        if (deepResearch) {
            webContent = await searchWebContent(webSearchContent);
        }
        const prompt = `Generate a professional PowerPoint presentation with ${numSlides} slides on the topic "${topic}".
Consider the following user preferences:
${preferencesSummary}
Research the web and think about the topic before generating. Web search results
<web_search_results>${JSON.stringify(webSearchContent)}</web_search_results>
<web_content>${webContent}</web_content>
Use language of topic.
Format the result as a JSON object with a key "slides" containing an array of slide objects.
Generate diverse and original/colorful/non-boring content.
Please ensure that text elements are not overlapped.
Use the following example schema as a reference for slide structure:
${exampleSchema}`;
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
        const isPrivate =
            user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
        const presentation = new Presentation({
            title: parsed.title || topic,
            description: parsed.description,
            version: parsed.version,
            model,
            theme: parsed.theme,
            slides: parsed.slides,
            slug: slugify(parsed.title || topic),
            userId: req.user.id,
            isPrivate
        });
        await presentation.save();
        res.status(201).json(parsed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/improve-presentation', authenticateToken, checkAiLimit, async (req, res) => {
    try {
        const { presentation, additions } = req.body;
        if (!additions) {
            return res.status(400).json({ error: 'Additions text is required' });
        }
        const user = await User.findById(req.user.id);
        if (
            !user ||
            (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trialing')
        ) {
            return res
                .status(403)
                .json({ error: 'Upgrade subscription to use improvement feature' });
        }
        const originalPresentation = await Presentation.findById(presentation._id);
        if (!originalPresentation) {
            return res.status(404).json({ error: 'Original presentation not found' });
        }
        const exampleSchema = fs.readFileSync(join(__dirname, 'presentationSchema.json'), 'utf8');
        const prompt = `Improve the following professional PowerPoint presentation by incorporating the following user additions:
${additions}

The original presentation JSON is:
${JSON.stringify(originalPresentation, null, 2)}

Use the following schema as a reference for the output:
${exampleSchema}

Return the improved presentation as a JSON object with a key "slides" containing an array of slide objects. Maintain a coherent title, description, version, and theme. Ensure the text elements are not overlapped.`;
        const effectiveModel = presentation.model || 'o3-mini';
        const effectiveTemperature = presentation.temperature || 0.7;
        const result = await generateAIResponse(prompt, effectiveModel, effectiveTemperature);
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
        parsed = await replaceGraphics(parsed, presentation.imageSource);
        const newPresentation = new Presentation({
            title: parsed.title || originalPresentation.title,
            description: parsed.description || originalPresentation.description,
            version: parsed.version,
            model: effectiveModel,
            theme: parsed.theme || originalPresentation.theme,
            slides: parsed.slides,
            slug: slugify(parsed.title || originalPresentation.title),
            userId: req.user.id,
            isPrivate: true
        });
        await newPresentation.save();
        res.status(201).json(parsed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/presentations', async (req, res) => {
    try {
        const search = req.query.search;
        let filter = { $or: [{ isPrivate: false }, { isPrivate: { $exists: false } }] };
        if (search) {
            filter = {
                $and: [
                    filter,
                    {
                        $or: [
                            { title: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } }
                        ]
                    }
                ]
            };
        }
        const presentations = await Presentation.find(filter).sort({ createdAt: -1 }).limit(300);
        const limitedPresentations = presentations.map((presentation) => ({
            _id: presentation._id,
            title: presentation.title,
            description: presentation.description,
            model: presentation.model,
            firstSlideTitle:
                presentation.slides && presentation.slides.length > 0
                    ? presentation.slides[0].title
                    : null,
            slug: presentation.slug
        }));
        res.status(200).json(limitedPresentations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/mypresentations', authenticateToken, async (req, res) => {
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
                            { description: { $regex: search, $options: 'i' } }
                        ]
                    }
                ]
            };
        }
        const presentations = await Presentation.find(query);
        const limitedPresentations = presentations.map((presentation) => ({
            _id: presentation._id,
            title: presentation.title,
            description: presentation.description,
            model: presentation.model,
            firstSlideTitle:
                presentation.slides && presentation.slides.length > 0
                    ? presentation.slides[0].title
                    : null,
            slug: presentation.slug
        }));
        res.status(200).json(limitedPresentations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/presentations/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        let presentation = null;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            presentation = await Presentation.findById(identifier);
        }
        if (!presentation) {
            presentation = await Presentation.findOne({ slug: identifier });
        }
        if (!presentation) return res.status(404).json({ error: 'Presentation not found' });
        res.status(200).json(presentation);
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
        const presentations = await Presentation.find();
        const staticRoutes = [
            '/',
            '/research',
            '/presentation',
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
        presentations.forEach((p) => {
            if (p.slug) {
                urls += `<url><loc>https://StyleScanner.vip/presentation/${p.slug}</loc></url>`;
            }
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
    if (!req.path.startsWith('/presentation/')) {
        return res.send(html);
    }
    const slug = req.path.substring(14);
    const enrichedHtml = await enrichMetadata(html, slug);
    res.send(enrichedHtml);
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
