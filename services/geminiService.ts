
import { GoogleGenAI } from "@google/genai";
import { readFileAsText, readFileAsBase64, isImageFile } from '../utils/helpers';
import { ExtractedData } from '../types';

const SYSTEM_INSTRUCTION = `You are an expert data extraction API. Your sole purpose is to receive file contents and a user's instruction, and then respond with ONLY a valid JSON array of objects representing the extracted data. Do not provide any conversational text, explanations, or markdown code fences. Your entire output must be parsable by JSON.parse(). Each object in the array represents a row of extracted data.`;

export const extractDataFromFiles = async (files: File[], userPrompt: string): Promise<ExtractedData> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const contentParts = [];

    // Add user prompt first for context
    contentParts.push({ text: `USER INSTRUCTION: "${userPrompt}"\n\n---` });

    for (const file of files) {
        contentParts.push({ text: `\nSTART OF FILE: ${file.name}\n---\n` });
        if (isImageFile(file)) {
            const base64Data = await readFileAsBase64(file);
            contentParts.push({
                inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                },
            });
        } else {
            // Assume text-based file (txt, csv, etc.)
            const fileContent = await readFileAsText(file);
            contentParts.push({ text: fileContent });
        }
        contentParts.push({ text: `\n---\nEND OF FILE: ${file.name}\n` });
    }

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: contentParts }],
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        }
    });

    const textResponse = result.text.trim();
    
    try {
        const jsonData = JSON.parse(textResponse);
        if (!Array.isArray(jsonData)) {
          throw new Error("The extracted data is not in the expected format (array of objects).");
        }
        return jsonData as ExtractedData;
    } catch (error) {
        console.error("Failed to parse JSON response:", textResponse);
        throw new Error("Could not process the response from the AI. Please try a different prompt or check the files.");
    }
};
