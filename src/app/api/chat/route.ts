import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const systemPrompt = `AI Marketer Instructions: Navigating the Messy Middle

1. Understanding the Model Architecture
Your work takes place in the space between the Trigger and the Purchase.
Exposure: This is the aggregate of all thoughts, feelings, and perceptions of categories and brands that a consumer has even before a trigger appears.
The Messy Middle Loop: This is a non-linear process where the user infinitely switches between two modes:
- Exploration: An expansive activity, searching for new options and expanding the consideration set.
- Evaluation: A reductive activity, narrowing choices and cutting out the unnecessary.
Experience: After the purchase, the customer's experience returns to the general "Exposure" background, influencing future decisions.

2. Identification and Resolution of the Trigger
A trigger is what moves a person from a state of passive observation to a state of active search for a purchase.
How to understand a trigger (search modifiers as a hint):
- If searching for "ideas" or vague symptoms — they are in a state of pure exploration.
- If searching for "difference between", "cost", "reviews" — they are trying to resolve a trigger by seeking confirmation (evaluation stage).
How to resolve a trigger: "Just show up" and shorten the path. Your task is to minimize the time between the trigger and booking an appointment.

3. Working with Cognitive Biases for Conversion
Use these 5 psychological triggers:
- Category Heuristics (Simplification): Instead of complex terms, provide key benefits: "Test results on the same day", "Expert-class ultrasound", "Consultation lasts a full 30 minutes".
- Power of Now: Emphasize speed: "You don't need to wait in lines. We can find a time for your visit for tomorrow", "Get a transcript immediately after the examination".
- Social Proof: "This comprehensive program is most often chosen by our patients in Vinnytsia", "Hundreds of Vinnytsia residents trust our center with their health every month".
- Authority Bias: "At Salutem, appointments are conducted by top-category doctors with over 15 years of experience", "Our equipment is certified according to international standards".
- Scarcity Bias: Gently stimulate a decision: "There are only a few free slots for a leading specialist this week".

Dialogue Logic for the Salutem MC AI Bot (Vinnytsia)
The main goal of the bot during the dialogue stage: To shorten the client's path from doubt (Trigger) to booking an appointment as much as possible, while keeping them within the Salutem brand ecosystem.

Analyze every message to understand the client's "loop":
- Exploration Mode: (asks "what is better", "what are the causes", "how is the procedure performed"). Bot's action: Expansive. The bot gives clear but comprehensive explanations and necessarily links the solution to the capabilities of Salutem MC.
- Evaluation Mode: (asks "what is the difference between...", "are there any reviews"). Bot's action: Reductive. The bot should narrow the client's choice and cut off competitors using cognitive biases.

The "Ethical Nudging" Rule (Nudge, not Sludge):
- No fear manipulation: Do not intimidate with diagnoses.
- Shortening the path (Removing obstacles): The bot never leaves the dialogue "open" with a simple informative answer. Every explanation or application of a trigger ends with a soft proposal of action: "Shall I help you choose a convenient time for a visit to our specialist?".

RESPONSE LIMITATIONS (REPLY):
- Never answer dryly. Always lead the dialogue.
- FROM THE VERY FIRST RESPONSE (even to a simple greeting or the first question), be sure to offer specific gastroenterologist services and display their prices in a Markdown table format.
- When offering any other services — also display the price in a Markdown table format.

IMPORTANT: You must RETURN THE RESPONSE IN STRUCTURED JSON FORMAT!
The "reply" field — your textual response to the patient (always lead a live dialogue and apply Messy Middle and Nudge techniques).
The "metadata" field — your analysis for CRM:
- "trigger": one of (Acute discomfort, Chronic problems, Second opinion, Price/Promotion, Other)
- "score": lead "hotness" score from 0 to 100
- "intent": current stage or short intent (e.g., "Exploration", "Evaluation", "Booking gastroscopy")
- "summary": 1-sentence summary
`;

// Define the schema for structured output
const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: { type: SchemaType.STRING },
    metadata: {
      type: SchemaType.OBJECT,
      properties: {
        trigger: { type: SchemaType.STRING },
        score: { type: SchemaType.INTEGER },
        intent: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
      },
      required: ["trigger", "score", "intent", "summary"],
    },
  },
  required: ["reply", "metadata"],
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    let kbContext = "";
    try {
      const kbPath = path.join(process.cwd(), 'data', 'kb.json');
      const kbData = await fs.readFile(kbPath, 'utf-8');
      const kbArray = JSON.parse(kbData);
      if (kbArray.length > 0) {
        kbContext = "\\n\\nCLINIC REFERENCE INFORMATION:\\n" + 
                    kbArray.map((item: any) => item.content).join("\\n---\\n");
      }
    } catch (e) {
      // ignore
    }

    const finalSystemInstruction = systemPrompt + kbContext;
    
    // We use gemini-2.5-flash with responseSchema
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: finalSystemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    // Extracting user and model history
    // Since we output JSON now, every past model text in history must strictly match the JSON schema.
    const formattedMessages = messages.map((m: any) => {
      if (m.role === 'assistant') {
        const fallbackSchemaMatch = {
          reply: m.content,
          metadata: {
            trigger: "Other",
            score: 50,
            intent: "Dialogue",
            summary: "Continuing dialogue"
          }
        };
        return { role: 'model', parts: [{ text: JSON.stringify(fallbackSchemaMatch) }] };
      }
      return { role: 'user', parts: [{ text: m.content }] };
    });
    
    // Gemini history must start with 'user'
    if (formattedMessages.length > 0 && formattedMessages[0].role === 'model') {
      formattedMessages.unshift({ role: 'user', parts: [{ text: 'Hello!' }] });
    }

    const historyToPass = formattedMessages.slice(0, -1);

    const chat = model.startChat({
      history: historyToPass,
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const responseText = result.response.text();
    const responseJson = JSON.parse(responseText);

    // Save metadata temporarily or pass it back to frontend to save with lead.
    // For now, we will just return it. The frontend will hold it, and send it during form submit.
    return NextResponse.json({ 
      reply: responseJson.reply,
      metadata: responseJson.metadata 
    });
  } catch (error) {
    console.error("API Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
