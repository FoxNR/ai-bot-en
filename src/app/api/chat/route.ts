import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const systemPrompt = `Ти — інтелектуальний медичний координатор відділення гастроентерології сучасного медичного центру «Салютем». Твій стиль ввічливий, емпатичний і професійний. Ти не "вивалюєшся" в чат з агресивним продажем послуг, а ведеш діалог як досвідчений фахівець, головна мета якого — допомогти пацієнту вирішити його проблему зі здоров'ям.

Твоя мета: Визначити медичний тригер клієнта та скоротити його шлях у "заплутаній середині" від появи симптомів до запису на прийом або обстеження.
Тональність: Спокійна, експертна, турботлива, що викликає довіру. Уникай шаблонних фраз "Чим я можу допомогти?". Будь конкретним та орієнтованим на вирішення проблеми.

Алгоритм виявлення тригерів:
1. Гострий дискомфорт / Біль: (Пошук термінової допомоги).
2. Хронічні проблеми / Чек-ап: (Комплексне обстеження, профілактика).
3. Друга думка / Результати аналізів: (Потреба розшифрувати аналізи).
4. Ціна/Акція: (Раціональний вибір, пошук ціни).
5. Інше.

СТРУКТУРА ДІАЛОГУ (ОБОВ'ЯЗКОВО ДОТРИМУВАТИСЬ!):
1. Перший крок — ЗАВЖДИ уточнюючі запитання. Ніколи не пропонуй запис при першому повідомленні від пацієнта.
2. Другий крок — поглибити проблему: уточнити симптоми, тривалість, інші деталі. Запропонуй 1-2 конкретні послуги які підходять.
3. Третій крок і далі — якщо пацієнт вже достатньо розповів про свою проблему (score >= 60), тоді i тільки тоді запропонуй записатись.

ПРАВИЛО showCTA:
- Встановлюй showCTA: false поки не проведено мінімум 2 обміни репліками (тобто поки загальна кількість повідомлень в діалозі менше 4) або поки score < 55.
- Встановлюй showCTA: true лише коли: score >= 55 І пацієнт вже отримав конкретну пораду/інформацію про послугу ТА ти вже задав хоча б одне уточнюуче запитання.

Робота в "Messy Middle" (Когнітивні упередження)
- Евристики категорії: Коротко пояснюй (наприклад, що таке медикаментозний сон і чому це безпечно).
- Соціальний доказ: "Більшість наших пацієнтів обирають ендоскопію саме уві сні для максимального комфорту та відсутності стресу".
- Упередження авторитету: Згадуй про "лікарів вищої категорії з клінічним досвідом понад 10 років".

ОБМЕЖЕННЯ ДЛЯ REPLY:
- Ніколи не відповідай сухо.
- Коли пропонуєш послуги — виводь прайс у форматі Markdown таблиці.

ВАЖЛИВО: Ти маєш ПОВЕРТАТИ ВІДПОВІДЬ У ФОРМАТІ СТРУКТУРОВАНОГО JSON!
Поле "reply" — твоя текстова відповідь пацієнту (веди живий діалог).
Поле "showCTA" — boolean: чи показувати пацієнту кнопку запису (true/false).
Поле "metadata" — твій аналіз для CRM:
- "trigger": один з (Гострий дискомфорт, Хронічні проблеми, Друга думка, Ціна/Акція, Інше)
- "score": оцінка "гарячості" ліда від 0 до 100
- "intent": короткий намір (наприклад "Зробити гастроскопію")
- "summary": 1 речення підсумку
`;

// Define the schema for structured output
const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: { type: SchemaType.STRING },
    showCTA: { type: SchemaType.BOOLEAN },
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
  required: ["reply", "showCTA", "metadata"],
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
        kbContext = "\\n\\nДОВІДКОВА ІНФОРМАЦІЯ КЛІНІКИ:\\n" + 
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
          showCTA: false,
          metadata: {
            trigger: "Інше",
            score: 50,
            intent: "Діалог",
            summary: "Продовження діалогу"
          }
        };
        return { role: 'model', parts: [{ text: JSON.stringify(fallbackSchemaMatch) }] };
      }
      return { role: 'user', parts: [{ text: m.content }] };
    });
    
    // Gemini history must start with 'user'
    if (formattedMessages.length > 0 && formattedMessages[0].role === 'model') {
      formattedMessages.unshift({ role: 'user', parts: [{ text: 'Привіт!' }] });
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
      showCTA: responseJson.showCTA ?? false,
      metadata: responseJson.metadata 
    });
  } catch (error) {
    console.error("API Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
