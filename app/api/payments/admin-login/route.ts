import { NextRequest, NextResponse } from "next/server";

const ADMIN_LOGIN = "Dsydney93";
const ADMIN_PASSWORD = "Tatarstan12345";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const login = String(body?.login || "");
    const password = String(body?.password || "");

    if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { ok: false, message: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set("admin_auth", "ok", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Ошибка авторизации" },
      { status: 400 }
    );
  }
}