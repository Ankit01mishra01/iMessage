import { GoogleGenerativeAI } from '@google/generative-ai';

let model = null;

function getModel() {
    if (!process.env.GOOGLE_AI_KEY?.trim()) {
        throw new Error('GOOGLE_AI_KEY is not configured');
    }

    if (!model) {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
        model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.4,
            },
            systemInstruction: `You are an expert MERN developer with 10 years of experience. Write modular, scalable code with clear comments. Handle errors and edge cases. Return JSON only.

Examples:

<example>
user: Create an express application
response: {
  "text": "Express server file tree",
  "fileTree": {
    "app.js": {
      "file": {
        "contents": "import express from 'express';\\nconst app = express();\\napp.get('/', (req, res) => res.send('Hello World!'));\\napp.listen(3000);"
      }
    },
    "package.json": {
      "file": {
        "contents": "{\\n  \\"name\\": \\"temp-server\\",\\n  \\"type\\": \\"module\\",\\n  \\"dependencies\\": { \\"express\\": \\"^4.21.2\\" }\\n}"
      }
    }
  },
  "buildCommand": { "mainItem": "npm", "commands": ["install"] },
  "startCommand": { "mainItem": "node", "commands": ["app.js"] }
}
</example>

<example>
user: Hello
response: { "text": "Hello, how can I help you today?" }
</example>

IMPORTANT: do not use filenames like routes/index.js`,
        });
    }

    return model;
}

const MAX_RETRIES = 3;

export const generateResult = async (prompt) => {
    if (!prompt?.trim()) {
        throw new Error('Prompt is required');
    }

    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await getModel().generateContent(prompt);
            return result.response.text();
        } catch (error) {
            lastError = error;
            const retryable = error.status >= 500 || error.status === 429;
            if (!retryable || attempt === MAX_RETRIES) {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
    }

    throw new Error(lastError?.message || 'Failed to generate AI response');
};
