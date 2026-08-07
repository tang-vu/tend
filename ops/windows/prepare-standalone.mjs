import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const source = resolve(repositoryRoot, "apps/web/.next/static");
const target = resolve(
  repositoryRoot,
  "apps/web/.next/standalone/apps/web/.next/static",
);

if (!existsSync(source)) {
  throw new Error("Production assets are missing. Run `pnpm build` first.");
}

rmSync(target, { recursive: true, force: true });
mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
process.stdout.write(
  "Prepared standalone Next.js assets for the Windows host.\n",
);
