import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { config } from "@/lib/config";

export async function GET(
  _: Request,
  context: { params: Promise<{ slug?: string[] }> } | { params: { slug?: string[] } },
) {
  const resolvedParams =
    "then" in context.params ? await context.params : context.params;
  const segments = resolvedParams.slug ?? [];
  if (segments.length === 0) {
    return NextResponse.json({ error: "Missing file name" }, { status: 400 });
  }

  const uploadsDir = path.resolve(config.uploadDir);
  const filePath = path.resolve(uploadsDir, ...segments);

  if (!filePath.startsWith(uploadsDir)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(filePath);
    const headers = new Headers();
    headers.set("content-type", "application/octet-stream");
    return new NextResponse(data, { headers });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
