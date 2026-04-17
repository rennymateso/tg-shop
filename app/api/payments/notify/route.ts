import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export const runtime = "nodejs";

function generateNotificationToken(
  payload: Record<string, unknown>,
  password: string
) {
  const data: Record<string, string> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (
      key === "Token" ||
      value === undefined ||
      value === null ||
      typeof value === "object"
    ) {
      continue;
    }

    data[key] = String(value);
  }

  data.Password = password;

  const source = Object.keys(data)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => data[key])
    .join("");

  return createHash("sha256").update(source, "utf8").digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const terminalPassword = process.env.TBANK_TERMINAL_PASSWORD;

    if (!terminalPassword) {
      return new NextResponse("FAIL", { status: 500 });
    }

    const body = await req.json();
    const incomingToken = String(body?.Token || "");

    const expectedToken = generateNotificationToken(body, terminalPassword);

    if (!incomingToken || incomingToken !== expectedToken) {
      return new NextResponse("FAIL", { status: 400 });
    }

    console.log("T-Bank notification:", body);

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("T-Bank notify error:", error);
    return new NextResponse("FAIL", { status: 500 });
  }
}