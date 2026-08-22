import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: 'Buildify API',
    status: 'ok',
    modules: ['projects', 'models'],
  });
}
