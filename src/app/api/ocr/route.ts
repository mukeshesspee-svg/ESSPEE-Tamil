import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { base64Image, languageMode } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server missing Gemini API Key. Developer needs to add GEMINI_API_KEY to .env" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash as it is a highly stable and scaled model less prone to 503s
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Clean the base64 string to just get the raw data
    const base64Data = base64Image.split(",")[1];
    const mimeType = base64Image.split(";")[0].split(":")[1] || "image/png";

    let prompt = "Extract all text from this image exactly as it appears. Maintain paragraphs and formatting.";
    if (languageMode === "tam") {
      prompt += " The text is strictly in Tamil and Numbers. Do not output any English letters.";
    } else if (languageMode === "eng") {
      prompt += " The text is strictly in English. Do not output any Tamil letters.";
    } else if (languageMode === "eng+tam-filtered") {
      prompt += " The image contains both Tamil and English. Extract ONLY the Tamil text and numbers. Ignore and exclude all English words.";
    } else {
      prompt += " The text may contain both Tamil and English.";
    }

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const extractedText = result.response.text();
    
    return NextResponse.json({ text: extractedText });
  } catch (error: any) {
    console.error("AI OCR Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image with AI" },
      { status: 500 }
    );
  }
}
