import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

import { config } from "./config";

export async function saveReceiptFile(file: File | null) {
  if (!file || file.size === 0) {
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".dat";
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.resolve(config.uploadDir);

  await fs.mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, buffer);

  return path.relative(process.cwd(), fullPath);
}
