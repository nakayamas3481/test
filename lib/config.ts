import { z } from "zod";

const configSchema = z.object({
  uploadDir: z.string().nonempty().default("./uploads"),
});

const parsed = configSchema.parse({
  uploadDir: process.env.UPLOAD_DIR,
});

export const config = {
  uploadDir: parsed.uploadDir,
};
