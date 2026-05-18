export type LogoType =
  | "wordmark"
  | "letterform"
  | "monogram"
  | "abstract"
  | "combination"
  | "emblem";

export type AiProviderName = "claude" | "openai";

export interface TextContentBlock {
  type: "text";
  text: string;
}

export interface ToolUseContentBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultContentBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

export type AgentContentBlock =
  | TextContentBlock
  | ToolUseContentBlock
  | ToolResultContentBlock;

export interface AgentMessage {
  role: "user" | "assistant";
  content: string | AgentContentBlock[];
}

export interface GenerateRequest {
  companyName: string;
  industry: string;
  logoType: LogoType;
  targetAudience: string;
  coreMission: string;
  brandAdjectives: string;
  competitors?: string;
  style?: string;
  colors?: string;
  provider?: AiProviderName;
}

export interface RefineRequest {
  sessionId: string;
  instruction: string;
}

export interface EvaluationResult {
  score: number;
  strengths: string[];
  improvements: string[];
  rulePassed: boolean;
  ruleIssues: string[];
}

export interface LogoResponse {
  sessionId: string;
  svg: string;
  turnCount: number;
  evaluation?: EvaluationResult;
}

export interface Session {
  id: string;
  provider: AiProviderName;
  history: AgentMessage[];
  brandContext: GenerateRequest;
  lastAccessedAt: number;
}
