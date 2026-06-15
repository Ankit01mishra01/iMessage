import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
const models = ['gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-001'];

for (const modelName of models) {
    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: 'application/json' },
        });
        const result = await model.generateContent('Return JSON with a text field saying hello');
        console.log(modelName, 'OK:', result.response.text());
        break;
    } catch (error) {
        console.log(modelName, 'FAIL:', error.message.split('\n')[0].slice(0, 150));
    }
}
