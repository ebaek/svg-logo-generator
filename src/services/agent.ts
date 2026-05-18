import {
  AgentMessage,
  GenerateRequest,
} from "../types/index.js";
import { executeTool } from "./tools.js";
import { extractSvg } from "../utils/svgParser.js";
import { AiProvider, ToolDefinition } from "./providers.js";

const TOOLS: ToolDefinition[] = [
  {
    name: "validate_svg",
    description:
      "Validates SVG markup. Call this after generating an SVG to confirm it is well-formed before returning it.",
    inputSchema: {
      type: "object" as const,
      properties: {
        svg: { type: "string", description: "The SVG markup to validate" },
        logoType: {
          type: "string",
          enum: ["wordmark", "letterform", "monogram", "abstract", "combination", "emblem"],
          description: "The expected logo type — enables type-specific structural checks",
        },
      },
      required: ["svg"],
    },
  },
  {
    name: "generate_color_palette",
    description:
      "Returns an industry-appropriate color palette. Call this before generating the SVG to get grounded hex color values.",
    inputSchema: {
      type: "object" as const,
      properties: {
        industry: { type: "string" },
        style: {
          type: "string",
          description: "e.g. minimalist, bold, playful, corporate, geometric, organic",
        },
        mood: {
          type: "string",
          description: "Optional. e.g. trustworthy, energetic, calm",
        },
      },
      required: ["industry", "style"],
    },
  },
  {
    name: "get_design_inspiration",
    description:
      "Returns design patterns, shapes, and style notes for the given logo type and industry. Call this first before generating.",
    inputSchema: {
      type: "object" as const,
      properties: {
        industry: { type: "string" },
        logoType: {
          type: "string",
          enum: ["wordmark", "letterform", "monogram", "abstract", "combination", "emblem"],
        },
      },
      required: ["industry", "logoType"],
    },
  },
  {
    name: "evaluate_logo",
    description:
      "Evaluates the SVG logo quality using type-specific structural rules and a brand-aware critic. Call after generating or revising. If score < 7, use improvements[] to self-correct and re-evaluate (max 1 revision).",
    inputSchema: {
      type: "object" as const,
      properties: {
        svg: { type: "string" },
        companyName: { type: "string" },
        industry: { type: "string" },
        logoType: {
          type: "string",
          enum: ["wordmark", "letterform", "monogram", "abstract", "combination", "emblem"],
        },
        style: { type: "string" },
        targetAudience: { type: "string" },
        brandAdjectives: { type: "string" },
      },
      required: [
        "svg", "companyName", "industry", "logoType",
        "style", "targetAudience", "brandAdjectives",
      ],
    },
  },
];

const SYSTEM_PROMPT = `You are an expert SVG logo designer with deep knowledge of brand identity.

When generating a new logo, follow this workflow in order:
1. Call get_design_inspiration to get type-specific patterns and industry conventions.
2. Call generate_color_palette to get grounded, industry-appropriate hex colors.
3. Generate an SVG logo strictly matching the requested logoType:
   - wordmark: text only — typography IS the entire logo; no standalone icons or shapes
   - letterform: one single dominant letter with a distinctive, custom treatment
   - monogram: exactly 2–3 initials in a tight, balanced composition
   - abstract: pure geometric/abstract shapes with NO text elements whatsoever
   - combination: both a symbol/icon AND a text wordmark, clearly distinct yet balanced
   - emblem: all elements (icon + text) enclosed within a single outer containing shape
4. Call validate_svg (with logoType) — if errors exist, fix them and re-validate.
5. Call evaluate_logo — if score < 7, revise the SVG using the improvements list, then re-evaluate once.
6. Return your final response containing the complete SVG followed by 2–3 sentences explaining your design choices.

SVG requirements for all types:
- Include viewBox="0 0 200 200" (square viewport)
- All styles must be inline attributes — no <style> blocks, no external fonts
- No external href, src, or url() references
- Use ≤5 distinct colors
- Keep markup under 4KB

When refining an existing logo:
- Preserve the overall concept unless the user asks for a complete redesign
- Re-validate and re-evaluate after changes
- The SVG in your response must always be complete and self-contained`;

function buildSystemPromptForGenerate(req: GenerateRequest): string {
  return `${SYSTEM_PROMPT}

Brand brief for this logo:
- Company: ${req.companyName}
- Industry: ${req.industry}
- Logo type: ${req.logoType}
- Target audience: ${req.targetAudience}
- Core mission: ${req.coreMission}
- Brand personality: ${req.brandAdjectives}${req.competitors ? `\n- Differentiate from: ${req.competitors}` : ""}${req.style ? `\n- Style preference: ${req.style}` : ""}${req.colors ? `\n- Color preference: ${req.colors}` : ""}`;
}

function applyPromptCaching(history: AgentMessage[]): AgentMessage[] {
  if (history.length < 2) return history;

  const messages = history.map((m) => ({ ...m }));

  // The neutral history keeps this hook in one place if provider-specific
  // caching is added later. For now we keep the full transcript unchanged.
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      break;
    }
  }

  return messages;
}

const MAX_ITERATIONS = 10;

async function runAgentLoop(
  provider: AiProvider,
  messages: AgentMessage[],
  system: string
): Promise<{ rawResponse: string; updatedHistory: AgentMessage[] }> {
  const history = [...messages];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await provider.complete({
      maxTokens: 4096,
      system,
      tools: TOOLS,
      messages: history,
    });

    if (response.toolCalls.length > 0) {
      // Append assistant message with all content blocks
      history.push({ role: "assistant", content: response.content });

      // Execute each tool call and collect results
      const toolResults = [];
      for (const block of response.toolCalls) {
        const result = await executeTool(
          { name: block.name, input: block.input },
          provider
        );
        toolResults.push({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: result,
        });
      }

      history.push({ role: "user", content: toolResults });
      continue;
    }

    history.push({ role: "assistant", content: response.text });
    return { rawResponse: response.text, updatedHistory: history };
  }

  throw new Error("Agent loop exceeded maximum iterations without completing.");
}

export async function generateLogo(
  provider: AiProvider,
  req: GenerateRequest
): Promise<{ svg: string; rawResponse: string; history: AgentMessage[] }> {
  const userMessage = `Design a ${req.logoType} logo for ${req.companyName}.

Company: ${req.companyName}
Industry: ${req.industry}
Logo type: ${req.logoType}
Target audience: ${req.targetAudience}
Core mission: ${req.coreMission}
Brand personality: ${req.brandAdjectives}${req.competitors ? `\nDifferentiate from: ${req.competitors}` : ""}${req.style ? `\nStyle preference: ${req.style}` : ""}${req.colors ? `\nColor preference: ${req.colors}` : ""}

Follow the workflow: get inspiration → get colors → generate SVG → validate → evaluate → return final SVG with explanation.`;

  const initialMessages: AgentMessage[] = [
    { role: "user", content: userMessage },
  ];

  const system = buildSystemPromptForGenerate(req);
  const { rawResponse, updatedHistory } = await runAgentLoop(
    provider, initialMessages, system
  );

  const svg = extractSvg(rawResponse);
  if (!svg) {
    throw new Error("No SVG found in agent response.");
  }

  return { svg, rawResponse, history: updatedHistory };
}

export async function refineLogo(
  provider: AiProvider,
  instruction: string,
  history: AgentMessage[],
  brandContext: GenerateRequest
): Promise<{ svg: string; rawResponse: string; history: AgentMessage[] }> {
  const cachedHistory = applyPromptCaching(history);
  const messagesWithInstruction: AgentMessage[] = [
    ...cachedHistory,
    { role: "user", content: instruction },
  ];

  const system = buildSystemPromptForGenerate(brandContext);
  const { rawResponse, updatedHistory } = await runAgentLoop(
    provider, messagesWithInstruction, system
  );

  const svg = extractSvg(rawResponse);
  if (!svg) {
    throw new Error("No SVG found in agent response.");
  }

  return { svg, rawResponse, history: updatedHistory };
}

export function summarizeOldHistory(
  history: AgentMessage[]
): AgentMessage[] {
  if (history.length <= 20) return history;

  // Find the second-to-last real user instruction (string content, not a tool_result).
  // We keep everything from that point forward so recentMessages always starts
  // with a proper user message — never a tool_result block. Two consecutive user
  // messages sent to the Anthropic API get merged, which would place a tool_result
  // at content[1] of the merged message and trigger a 400 error.
  let keepFromIndex = 0;
  let realInstructionsFound = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === "user" && typeof msg.content === "string") {
      realInstructionsFound++;
      if (realInstructionsFound >= 2) {
        keepFromIndex = i;
        break;
      }
    }
  }

  const recentMessages = history.slice(keepFromIndex);

  const oldInstructions = history
    .slice(0, keepFromIndex)
    .filter((m) => m.role === "user" && typeof m.content === "string")
    .map((m) => (m.content as string).slice(0, 200))
    .join(" | ");

  if (!oldInstructions) {
    return recentMessages;
  }

  // Embed the summary into the first real user message to avoid consecutive
  // user messages (which the API would merge, breaking tool_use/tool_result pairing).
  const [firstMsg, ...rest] = recentMessages;
  const enrichedFirst: AgentMessage = {
    role: "user",
    content: `[Prior refinements summarized: ${oldInstructions}]\n\n${firstMsg.content as string}`,
  };

  return [enrichedFirst, ...rest];
}
