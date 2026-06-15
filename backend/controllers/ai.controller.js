import * as ai from '../services/ai.service.js';

export const getResult = async (req, res) => {
    try {
        const { prompt } = req.query;
        if (!prompt?.trim()) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const result = await ai.generateResult(prompt);
        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
