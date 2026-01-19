
import { GoogleGenAI, Type, Part } from "@google/genai";
import { Question } from '../types';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper to convert File to a GoogleGenAI.Part object
async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}


export async function parseMCQs(text: string): Promise<Question[] | null> {
  const prompt = `
    Parse the following text which contains multiple choice questions. For each question, identify the question itself, all the possible options, and the correct answer.
    The correct answer is typically indicated by an asterisk (*) at the end of the option. The option text in the final JSON should not include the asterisk.
    Format the output as a valid JSON array of objects. Each object must have 'question' (string), 'options' (an array of strings), and 'correctAnswer' (a string that exactly matches one of the options).
    Do not include the letter prefix (e.g., "a)", "b)") in the option text.

    Here is the text:
    ---
    ${text}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The question text.",
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "An array of possible answers.",
              },
              correctAnswer: {
                type: Type.STRING,
                description: "The correct answer, which must match one of the options.",
              },
            },
            required: ["question", "options", "correctAnswer"],
          },
        },
      },
    });

    const jsonString = response.text;
    if (!jsonString) {
      throw new Error("API returned an empty response.");
    }

    const parsedData = JSON.parse(jsonString);
    
    // Basic validation of the parsed data
    if (!Array.isArray(parsedData) || parsedData.some(item => !item.question || !item.options || !item.correctAnswer)) {
        throw new Error("Parsed data is not in the expected format.");
    }
    
    return parsedData as Question[];

  } catch (error) {
    console.error("Error parsing MCQs with Gemini:", error);
    throw new Error("Failed to parse questions. The AI model could not understand the input format.");
  }
}

export async function generateMCQs(files: File[], numQuestions: number): Promise<Question[] | null> {
  const prompt = `
    You are an expert in creating educational content. Based on the content of the provided files (which can be text, images, or documents), please generate ${numQuestions} multiple-choice questions (MCQs).
    Each question should test a key concept from the provided materials.
    For each question, provide 4 distinct options.
    One of these options must be the correct answer.
    
    Format the output as a valid JSON array of objects. Each object must adhere to the following structure:
    - "question": A string containing the question text.
    - "options": An array of 4 strings representing the possible answers.
    - "correctAnswer": A string that exactly matches one of the provided options.

    Do not include any other text or explanations outside of the JSON array.
  `;

  try {
    const fileParts = await Promise.all(files.map(fileToGenerativePart));
    
    const contents = [
      { text: prompt },
      ...fileParts
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The question text.",
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "An array of 4 possible answers.",
              },
              correctAnswer: {
                type: Type.STRING,
                description: "The correct answer, which must match one of the options.",
              },
            },
            required: ["question", "options", "correctAnswer"],
          },
        },
      },
    });

    const jsonString = response.text;
    if (!jsonString) {
      throw new Error("API returned an empty response.");
    }

    const parsedData = JSON.parse(jsonString);
    
    if (!Array.isArray(parsedData) || parsedData.some(item => !item.question || !item.options || !item.correctAnswer)) {
        throw new Error("Generated data is not in the expected format.");
    }
    
    return parsedData as Question[];

  } catch (error) {
    console.error("Error generating MCQs with Gemini:", error);
    throw new Error("Failed to generate questions. The AI model could not process the provided files.");
  }
}
