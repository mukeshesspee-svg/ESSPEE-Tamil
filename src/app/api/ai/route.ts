import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt, tone, language = 'tamil' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server missing Gemini API Key. Developer needs to add GEMINI_API_KEY to .env" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash as it is highly stable
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const isEnglish = language === "english";
    const langName = isEnglish ? "English" : "Tamil";

    let systemInstruction = "";
    if (tone === "professional") {
      systemInstruction = `You are a professional ${langName} copywriter. Write the response in highly professional, formal ${langName} suitable for business or official use.`;
    } else if (tone === "formal") {
      systemInstruction = `You are a formal ${langName} writer. Use respectful, formal ${langName}.`;
    } else if (tone === "simple") {
      systemInstruction = `You are a helpful assistant. Write the response in very simple, easy-to-understand conversational ${langName}.`;
    } else if (tone === "creative") {
      systemInstruction = `You are a creative ${langName} author. Write the response using beautiful, expressive, and poetic ${langName} phrasing.`;
    }

    const finalPrompt = `${systemInstruction}\n\nUser Request: ${prompt}\n\nPlease respond ONLY with the ${langName} content requested, without any introductory or concluding phrases.`;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI Writer Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process AI Writer request" },
      { status: 500 }
    );
  }
}
