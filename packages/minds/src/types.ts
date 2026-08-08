import type {
  Community,
  CommunityTenet,
  FollowUpAssessment,
  Incident,
  MemoryReceipt,
  MindDecision,
} from "@tend/core";

export interface AnalyzeIncidentInput {
  community: Community;
  tenets: CommunityTenet[];
  activeMemories: MemoryReceipt[];
  message: string;
  conversationContext: Array<{
    author: string;
    content: string;
    offset: string;
  }>;
}

export interface TeachMemoryInput {
  communityId: string;
  statement: string;
}

export interface AnalyzeFollowUpInput {
  community: Community;
  tenets: CommunityTenet[];
  activeMemories: MemoryReceipt[];
  incident: Incident;
  purpose: string;
  observedAt: string;
  freshMessages: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }>;
}

export interface MindsReference {
  provider: "mock" | "live" | "unavailable";
  conversationAlias: string | null;
  responseFingerprint: string | null;
  promptVersion: string;
}

export interface MindsAnalysisResult {
  decision: MindDecision;
  reference: MindsReference;
  status: "ok" | "manual_review";
  notice: string;
}

export interface MindsFollowUpResult {
  assessment: FollowUpAssessment;
  reference: MindsReference;
  status: "ok" | "manual_review";
  notice: string;
}

export interface MindsAdapter {
  readonly mode: "mock" | "live" | "unavailable";
  teach(input: TeachMemoryInput): Promise<MindsReference>;
  analyzeIncident(input: AnalyzeIncidentInput): Promise<MindsAnalysisResult>;
  analyzeFollowUp(input: AnalyzeFollowUpInput): Promise<MindsFollowUpResult>;
}
