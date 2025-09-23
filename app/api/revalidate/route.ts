// app/api/revalidate/route.ts
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST() {
  try {
    revalidateTag('images-data');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error: unknown) {
    return NextResponse.json({ revalidated: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}