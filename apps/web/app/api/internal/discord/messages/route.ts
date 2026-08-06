import { activeEvidence } from "@tend/core";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, requireWorkerAuth } from "@/lib/http";
import { getMindsAdapter, getRepository } from "@/lib/server";

const inputSchema = z.object({
  externalMessageId: z.string().min(1).max(128),
  guildId: z.string().min(1).max(128),
  channelId: z.string().min(1).max(128),
  actorId: z.string().min(1).max(128),
  actorDisplayName: z.string().min(1).max(128),
  message: z.string().min(1).max(4_000),
  conversationContext: z
    .array(
      z.object({
        author: z.string().min(1).max(128),
        content: z.string().max(4_000),
        offset: z.string().max(32),
      }),
    )
    .max(20),
});

function configuredChannels(): Set<string> {
  return new Set(
    (process.env.DISCORD_ALLOWED_CHANNEL_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export async function POST(request: Request) {
  const unauthorized = requireWorkerAuth(request);
  if (unauthorized) return unauthorized;
  try {
    if (process.env.TEND_MODE !== "live") {
      return NextResponse.json(
        { ok: false, error: "Discord intake is disabled outside live mode." },
        { status: 409 },
      );
    }
    const input = inputSchema.parse(await request.json());
    if (
      input.guildId !== process.env.DISCORD_GUILD_ID ||
      !configuredChannels().has(input.channelId)
    ) {
      return NextResponse.json(
        { ok: false, error: "Guild or channel is not allowlisted." },
        { status: 403 },
      );
    }
    const repository = getRepository();
    if (repository.hasProcessedMessage(input.externalMessageId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    const snapshot = repository.getSnapshot();
    const analysis = await getMindsAdapter().analyzeIncident({
      community: snapshot.community,
      tenets: snapshot.tenets,
      activeMemories: activeEvidence(snapshot.memories),
      message: input.message,
      conversationContext: input.conversationContext,
    });
    const destinationBoundDecision = {
      ...analysis.decision,
      proposedActions: analysis.decision.proposedActions.map((action) => ({
        ...action,
        targetId:
          action.type === "public_nudge"
            ? input.channelId
            : action.type === "private_reminder"
              ? input.actorId
              : action.targetId,
      })),
    };
    const incident = repository.recordAnalyzedIncident({
      externalMessageId: input.externalMessageId,
      actorId: input.actorId,
      messageExcerpt: input.message,
      conversationContext: input.conversationContext,
      decision: destinationBoundDecision,
      forceManualReview: analysis.status !== "ok",
    });
    repository.markMessageProcessed(
      input.externalMessageId,
      snapshot.community.id,
    );
    return NextResponse.json({
      ok: true,
      duplicate: false,
      incidentId: incident.id,
      status: incident.status,
      mindsProvider: analysis.reference.provider,
      externalActionOccurred: false,
    });
  } catch (error) {
    return apiError(error);
  }
}
