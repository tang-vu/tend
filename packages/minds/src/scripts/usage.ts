import { printSafeError, requireMindsEnvironment } from "./shared";

try {
  const { client, mindId } = requireMindsEnvironment();
  const [usage, byTool, balance] = await Promise.all([
    client.getCognitionUsage(mindId, { interval: "1d" }),
    client.getCognitionUsageByTool(mindId, { interval: "day" }),
    client.getCognitionBalance(mindId),
  ]);
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        mindId,
        cognition: balance.cognition,
        timeline: usage.items,
        byTool: byTool.summary,
        secretsPrinted: false,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  printSafeError(error);
}
