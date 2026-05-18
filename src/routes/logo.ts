import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import {
  AiProviderName,
  Session,
  GenerateRequest,
  RefineRequest,
  LogoResponse,
} from "../types/index.js";
import { generateLogo, refineLogo, summarizeOldHistory } from "../services/agent.js";
import { evaluateLogo } from "../services/tools.js";
import { AiProvider, createAiProvider } from "../services/providers.js";

dotenv.config();

const router = Router();
const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 30 * 60 * 1000;
const providers = new Map<AiProviderName, AiProvider>();

function normalizeProviderName(providerName?: string): AiProviderName {
  const normalized = (providerName ?? process.env.AI_PROVIDER ?? "claude").toLowerCase();
  if (normalized === "openai" || normalized === "chatgpt" || normalized === "gpt") {
    return "openai";
  }
  if (normalized === "claude" || normalized === "anthropic") {
    return "claude";
  }
  throw new Error(`Unsupported AI provider: ${providerName}`);
}

function getProvider(providerName?: string): AiProvider {
  const name = normalizeProviderName(providerName);
  const cached = providers.get(name);
  if (cached) return cached;

  const provider = createAiProvider(name);
  providers.set(name, provider);
  return provider;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function pruneExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastAccessedAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

router.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    defaultProvider: normalizeProviderName(),
    availableProviders: {
      claude: Boolean(process.env.ANTHROPIC_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
  });
});

router.post("/generate", async (req: Request, res: Response) => {
  pruneExpiredSessions();

  const body = req.body as GenerateRequest;

  if (
    !body.companyName ||
    !body.industry ||
    !body.logoType ||
    !body.targetAudience ||
    !body.coreMission ||
    !body.brandAdjectives
  ) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  try {
    const provider = getProvider(body.provider);
    const { svg, history } = await generateLogo(provider, body);

    // Run evaluation after generation so frontend can display the score
    const evaluation = await evaluateLogo(
      provider,
      svg,
      body.companyName,
      body.industry,
      body.logoType,
      body.style ?? "minimalist",
      body.targetAudience,
      body.brandAdjectives
    );

    const sessionId = generateSessionId();
    sessions.set(sessionId, {
      id: sessionId,
      provider: provider.name,
      history,
      brandContext: body,
      lastAccessedAt: Date.now(),
    });

    const response: LogoResponse = {
      sessionId,
      svg,
      turnCount: 1,
      evaluation,
    };

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("No SVG found")) {
      res.status(422).json({ error: "No SVG in response — please try again." });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

router.post("/refine", async (req: Request, res: Response) => {
  pruneExpiredSessions();

  const body = req.body as RefineRequest;

  if (!body.sessionId || !body.instruction) {
    res.status(400).json({ error: "Missing sessionId or instruction." });
    return;
  }

  const session = sessions.get(body.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session expired or not found. Please generate a new logo." });
    return;
  }

  session.lastAccessedAt = Date.now();

  // Cap history to prevent unbounded growth
  const trimmedHistory = summarizeOldHistory(session.history);

  try {
    const provider = getProvider(session.provider);
    const { svg, history: updatedHistory } = await refineLogo(
      provider,
      body.instruction,
      trimmedHistory,
      session.brandContext
    );

    // Count user turns (refinements) in history
    const turnCount = updatedHistory.filter((m) => m.role === "user").length;

    session.history = updatedHistory;

    const evaluation = await evaluateLogo(
      provider,
      svg,
      session.brandContext.companyName,
      session.brandContext.industry,
      session.brandContext.logoType,
      session.brandContext.style ?? "minimalist",
      session.brandContext.targetAudience,
      session.brandContext.brandAdjectives
    );

    const response: LogoResponse = {
      sessionId: body.sessionId,
      svg,
      turnCount,
      evaluation,
    };

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("No SVG found")) {
      res.status(422).json({ error: "No SVG in response — please try again." });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

router.delete("/session/:sessionId", (req: Request, res: Response) => {
  sessions.delete(req.params.sessionId);
  res.json({ ok: true });
});

export { router as logoRouter };
