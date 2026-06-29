import { createServerFn } from "@tanstack/react-start";
import { generateText, type ModelMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const adminChat = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[]; context: string }) => data)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const gateway = createLovableAiGatewayProvider(key);

    const systemPrompt =
      "You are the admin assistant for Cafetería Baratto in Valencia. " +
      "Answer concisely using the LIVE CONTEXT below. If asked about items, orders, " +
      "or revenue, ground every answer in this data. Do not invent items.\n\n" +
      "LIVE CONTEXT:\n" +
      data.context;

    try {
      const { text } = await generateText({
        model: gateway.chatModel("google/gemini-3-flash-preview"),
        instructions: systemPrompt,
        messages: data.messages as ModelMessage[],
      });
      return { reply: text };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI assistant unavailable";
      if (message.includes("429")) throw new Error("Rate limit reached. Please retry shortly.");
      if (message.includes("402")) throw new Error("AI credits exhausted. Add credits in Settings.");
      throw new Error(message);
    }
  });
