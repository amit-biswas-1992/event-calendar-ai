// app/api/events/route.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const model = new ChatGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
  modelName: "gemini-pro",
  maxOutputTokens: 2048,
});

const promptTemplate = PromptTemplate.fromTemplate(
  "Generate 10 world events in bangla text that occurred on {date} (format: Month Day). Include a mix of education, research, political, historical, scientific, and cultural events. Format the output as a JSON array of objects, each with 'category' and 'event' keys. Do not include any markdown formatting or additional text."
);

const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

function cleanJsonResponse(response: string): string {
  // Remove any markdown formatting
  let cleaned = response.replace(/```json\n?|\n?```/g, '');
  
  // Attempt to find the JSON array within the cleaned string
  const match = cleaned.match(/\[[\s\S]*\]/);
  return match ? match[0] : cleaned;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const encodedDate = searchParams.get('date');

  if (!encodedDate) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    const decodedDate = decodeURIComponent(encodedDate);
    const [month, day] = decodedDate.split('%20');
    const date = `${month}`;

    const result = await chain.invoke({ date });
    
    // Clean the response and attempt to parse it
    const cleanedResult = cleanJsonResponse(result);
    let events;
    try {
      events = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
    }

    // Validate that events is an array
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
    }

    // Return the events as JSON
    return NextResponse.json(events);
  } catch (error) {
    console.error(`Error fetching events for ${encodedDate}:`, error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}