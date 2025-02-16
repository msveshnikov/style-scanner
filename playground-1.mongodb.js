/* eslint-disable no-undef */
/* eslint-disable react-hooks/rules-of-hooks */
/* global use, db */

use('style');

db.users.updateOne(
    { email: 'msveshnikov@gmail.com' },
    {
        $set: {
            isAdmin: true,
            subscriptionStatus: 'active',
            role: 'admin'
        }
    },
    { upsert: true }
);

use('style');
db.insights.updateOne(
    { _id: ObjectId('67aa7d724aa8d8bc71712608') },
    {
        $set: {
            isPrivate: false
        }
    }
);

db.insights.insertMany([
    {
        title: 'AI-Driven Research Insight',
        slides: [
            { layout: 'title', content: 'AI-Driven Research' },
            { layout: 'bullet', content: 'Automated Research Aggregation' },
            { layout: 'bullet', content: 'Dynamic Slide Generation' },
            { layout: 'footer', content: 'Powered by StyleScanner.vip' }
        ],
        aiSummary:
            'This insight synthesizes AI-powered research insights, offering dynamic content generation via the InsightCreator component.',
        customizationOptions: { theme: 'default', layout: 'standard' },
        createdAt: new Date()
    },
    {
        title: 'Innovations in AI Research',
        slides: [
            { layout: 'title', content: 'Innovations in AI' },
            {
                layout: 'text',
                content:
                    'Explore cutting-edge research and AI integrations that drive modern innovation.'
            },
            { layout: 'footer', content: 'StyleScanner.vip - From Idea to Impact' }
        ],
        aiSummary:
            'A deep dive into the latest AI research, this insight exemplifies the intelligent fusion of data, design, and dynamic customization.',
        customizationOptions: { theme: 'modern', layout: 'creative' },
        createdAt: new Date()
    }
]);

db.researchInsights.insertOne({
    insightTitle: 'AI-Driven Research Insight',
    insights: [
        { topic: 'Market Trends', analysis: 'Growing impact of AI in market dynamics.' },
        {
            topic: 'Technology Advancements',
            analysis: 'Rapid innovation and integration of AI in various sectors.'
        }
    ],
    createdAt: new Date()
});

db.insights.createIndex({ createdAt: 1 });
db.researchInsights.createIndex({ createdAt: 1 });

db.createView('insightAnalytics', 'insights', [
    {
        $project: {
            title: 1,
            slidesCount: { $size: '$slides' },
            createdAt: 1
        }
    }
]);
