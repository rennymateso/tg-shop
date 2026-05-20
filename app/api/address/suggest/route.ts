import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, type } = await req.json();

    if (!query || query.length < 2) {
      return NextResponse.json({
        suggestions: [],
      });
    }

    const response = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.DADATA_API_KEY}`,
        },
        body: JSON.stringify({
          query,
          count: 8,
          from_bound: {
            value: type,
          },
          to_bound: {
            value: type,
          },
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json({
      suggestions: data.suggestions || [],
    });
  } catch (error) {
    return NextResponse.json({
      suggestions: [],
    });
  }
}