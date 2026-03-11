import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { resolveEntityIdByName } from "@/lib/entityMatching";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { text } = body as { text: string };

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing required field: text" }, { status: 400 });
  }

  const [categories, accounts] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ isSystem: true }, { userId: session.user.id }] },
      select: { id: true, name: true },
    }),
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
    }),
  ]);

  const categoryList = categories.map((c) => c.name).join(", ");
  const accountList = accounts.map((a) => a.name).join(", ");

  const prompt = `You are a financial transaction parser. Extract structured data from the following natural language text describing a financial transaction.

Available categories: ${categoryList}
Available accounts: ${accountList}

Return ONLY a valid JSON object with these exact fields:
- amount: number or null (positive number, e.g. 25.50)
- type: "INCOME" or "EXPENSE" or null
- categoryName: string or null (must match one of the available categories exactly, or null)
- accountName: string or null (must match one of the available accounts exactly, or null)
- description: string or null (brief description of the transaction)
- date: string or null (ISO 8601 date format YYYY-MM-DD, or null if not specified)

If you cannot determine a field from the text, set it to null.
Do not include any explanation or text outside the JSON object.

Transaction text: "${text}"`;

  let parsed: {
    amount: number | null;
    type: "INCOME" | "EXPENSE" | null;
    categoryName: string | null;
    accountName: string | null;
    description: string | null;
    date: string | null;
  };

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const jsonText = content.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    parsed = JSON.parse(jsonText);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to parse transaction with AI: ${message}` },
      { status: 500 }
    );
  }

  const categoryId = resolveEntityIdByName(categories, parsed.categoryName);
  const accountId = resolveEntityIdByName(accounts, parsed.accountName);

  return NextResponse.json({
    amount: parsed.amount ?? null,
    type: parsed.type ?? null,
    categoryId,
    accountId,
    description: parsed.description ?? null,
    date: parsed.date ?? null,
  });
}
