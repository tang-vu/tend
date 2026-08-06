import { requireMindsEnvironment, printSafeError } from "./shared";

try {
  const { client, mindId } = requireMindsEnvironment();
  const minds = await client.listMinds();
  const selected = minds.find((mind) => mind.mindId === mindId);
  if (!selected)
    throw new Error("MINDS_MIND_ID is not available to this Builder account.");
  const detail = await client.getMind(mindId);
  const balance = await client.getCognitionBalance(mindId);
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        configuredMindId: mindId,
        mindFound: true,
        enabled: detail.isEnabled,
        cognitionAvailable: balance.cognition,
        secretsPrinted: false,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  printSafeError(error);
}
