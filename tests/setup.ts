import { execSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll } from "vitest";

process.env.DATABASE_URL = "file:../test.db";
process.env.SESSION_SECRET = "test-session-secret-32chars";
process.env.UPLOAD_DIR = "./uploads-test";

const cwd = process.cwd();
const testDbPath = join(cwd, "test.db");
const uploadsPath = join(cwd, "uploads-test");

beforeAll(() => {
  cleanup();
  if (!existsSync(testDbPath)) {
    writeFileSync(testDbPath, "");
  }
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "inherit",
    cwd,
    env: {
      ...process.env,
      DATABASE_URL: "file:../test.db",
    },
  });
});

afterAll(() => {
  cleanup();
});

function cleanup() {
  if (existsSync(testDbPath)) {
    rmSync(testDbPath);
  }
  if (existsSync(uploadsPath)) {
    rmSync(uploadsPath, { recursive: true, force: true });
  }
}
