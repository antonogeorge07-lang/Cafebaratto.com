import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const adminChat = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[]; context: string }) => data)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const system: ChatMessage = {
      role: "system",
      content:
        "You are the admin assistant for Cafetería Baratto in Valencia. " +
        "Answer concisely using the LIVE CONTEXT below. If asked about items, orders, " +
        "or revenue, ground every answer in this data. Do not invent items.\n\n" +
        "LIVE CONTEXT:\n" +
        data.context,
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [system, ...data.messages],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please retry shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings.");
      throw new Error(`AI gateway error ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { reply: json.choices?.[0]?.message?.content ?? "" };
  });
