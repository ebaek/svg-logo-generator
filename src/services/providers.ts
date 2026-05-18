import Anthropic from "@anthropic-ai/sdk";
import {
  AgentContentBlock,
  AgentMessage,
  AiProviderName,
  ToolResultContentBlock,
  ToolUseContentBlock,
} from "../types/index.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface CompletionResult {
  content: AgentContentBlock[];
  text: string;
  toolCalls: ToolUseContentBlock[];
}

export interface AiProvider {
  name: AiProviderName;
  model: string;
  complete(input: {
    system?: string;
    messages: AgentMessage[];
    tools?: ToolDefinition[];
    maxTokens?: number;
  }): Promise<CompletionResult>;
}

function normalizeContent(content: AgentContentBlock[]): string {
  return content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}

class ClaudeProvider implements AiProvider {
  public readonly name = "claude";

  private readonly client: Anthropic;

  constructor(apiKey: string | undefined, public readonly model: string) {
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required when using the Claude provider.");
    }
    this.client = new Anthropic({ apiKey });
  }

  async complete(input: {
    system?: string;
    messages: AgentMessage[];
    tools?: ToolDefinition[];
    maxTokens?: number;
  }): Promise<CompletionResult> {
    const claudeMessages = input.messages.map(toClaudeMessage);
    let response: Awaited<ReturnType<typeof this.client.messages.create>>;
    try {
      response = await this.client.messages.create({
        model: this.model,
        max_tokens: input.maxTokens ?? 4096,
        system: input.system,
        tools: input.tools?.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
        })),
        messages: claudeMessages,
      });
    } catch (err) {
      console.error("[ClaudeProvider] API error. Messages sent:\n", JSON.stringify(claudeMessages, null, 2));
      throw err;
    }

    const content = response.content.map((block): AgentContentBlock => {
      if (block.type === "tool_use") {
        return {
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        };
      }
      if (block.type === "text") {
        return { type: "text", text: block.text };
      }
      return { type: "text", text: "" };
    });

    return {
      content,
      text: normalizeContent(content),
      toolCalls: content.filter(
        (block): block is ToolUseContentBlock => block.type === "tool_use"
      ),
    };
  }
}

function toClaudeMessage(message: AgentMessage): Anthropic.MessageParam {
  if (typeof message.content === "string") {
    return { role: message.role, content: message.content };
  }

  return {
    role: message.role,
    content: message.content.map((block): Anthropic.ContentBlockParam => {
      if (block.type === "tool_use") {
        return {
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input,
        };
      }

      if (block.type === "tool_result") {
        return {
          type: "tool_result",
          tool_use_id: block.tool_use_id,
          content: block.content,
        };
      }

      return { type: "text", text: block.text };
    }),
  };
}

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

class OpenAIProvider implements AiProvider {
  public readonly name = "openai";

  constructor(private readonly apiKey: string | undefined, public readonly model: string) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required when using the OpenAI provider.");
    }
  }

  async complete(input: {
    system?: string;
    messages: AgentMessage[];
    tools?: ToolDefinition[];
    maxTokens?: number;
  }): Promise<CompletionResult> {
    const messages: OpenAIChatMessage[] = [
      ...(input.system ? [{ role: "system" as const, content: input.system }] : []),
      ...input.messages.flatMap(toOpenAIMessages),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: input.maxTokens ?? 4096,
        tools: input.tools?.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
          },
        })),
      }),
    });

    const data = (await response.json()) as OpenAIChatResponse;
    if (!response.ok) {
      throw new Error(data.error?.message ?? `OpenAI request failed with ${response.status}.`);
    }

    const message = data.choices[0]?.message;
    if (!message) {
      throw new Error("OpenAI response did not include a message.");
    }

    const content: AgentContentBlock[] = [];
    if (message.content) {
      content.push({ type: "text", text: message.content });
    }

    for (const toolCall of message.tool_calls ?? []) {
      content.push({
        type: "tool_use",
        id: toolCall.id,
        name: toolCall.function.name,
        input: parseToolArguments(toolCall.function.arguments),
      });
    }

    return {
      content,
      text: normalizeContent(content),
      toolCalls: content.filter(
        (block): block is ToolUseContentBlock => block.type === "tool_use"
      ),
    };
  }
}

function toOpenAIMessages(message: AgentMessage): OpenAIChatMessage[] {
  if (typeof message.content === "string") {
    return [{ role: message.role, content: message.content }];
  }

  const text = message.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
  const toolCalls = message.content.filter(
    (block): block is ToolUseContentBlock => block.type === "tool_use"
  );
  const toolResults = message.content.filter(
    (block): block is ToolResultContentBlock => block.type === "tool_result"
  );

  if (message.role === "assistant") {
    return [
      {
        role: "assistant",
        content: text || null,
        tool_calls: toolCalls.map((toolCall) => ({
          id: toolCall.id,
          type: "function",
          function: {
            name: toolCall.name,
            arguments: JSON.stringify(toolCall.input),
          },
        })),
      },
    ];
  }

  return [
    ...(text ? [{ role: "user" as const, content: text }] : []),
    ...toolResults.map((result) => ({
      role: "tool" as const,
      tool_call_id: result.tool_use_id,
      content: result.content,
    })),
  ];
}

function parseToolArguments(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function createAiProvider(providerName?: string): AiProvider {
  const name = (providerName ?? process.env.AI_PROVIDER ?? "claude").toLowerCase();

  if (name === "openai" || name === "chatgpt" || name === "gpt") {
    return new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL ?? "gpt-4o");
  }

  if (name === "claude" || name === "anthropic") {
    return new ClaudeProvider(
      process.env.ANTHROPIC_API_KEY,
      process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6"
    );
  }

  throw new Error(`Unsupported AI provider: ${providerName}`);
}
