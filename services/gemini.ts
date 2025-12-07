import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini client only if key exists, but don't crash if missing (handle gracefully in UI)
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateTaskDescription = async (taskTitle: string, role: string): Promise<string> => {
  if (!ai) {
    return "AI service unavailable. Please configure API_KEY.";
  }

  try {
    const prompt = `
      Write a concise, professional, and clear task description for a task titled "${taskTitle}". 
      The task is assigned to a ${role}. 
      Keep it under 50 words. 
      Format as plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate description. Please try again.";
  }
};

export const suggestPointsForTask = async (taskTitle: string, difficulty: string): Promise<number> => {
  if (!ai) return 10;

  try {
     const prompt = `
      Suggest a point value (integer between 10 and 100) for a workplace task titled "${taskTitle}" with difficulty "${difficulty}".
      Return ONLY the number.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text;
    const num = parseInt(text ? text.trim() : "50");
    return isNaN(num) ? 50 : num;
  } catch (e) {
    return 50;
  }
}