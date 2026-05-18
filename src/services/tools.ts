import { LogoType, EvaluationResult } from "../types/index.js";
import { AiProvider } from "./providers.js";

// ---------------------------------------------------------------------------
// Color palette data
// ---------------------------------------------------------------------------

interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  rationale: string;
}

const COLOR_PALETTES: Record<string, Record<string, Palette>> = {
  technology: {
    minimalist: { primary: "#1A1A2E", secondary: "#16213E", accent: "#0F3460", background: "#FFFFFF", rationale: "Deep navy tones convey trust and precision; white space keeps it clean." },
    bold: { primary: "#2B4EFF", secondary: "#1A1A2E", accent: "#FF6B35", background: "#FFFFFF", rationale: "Electric blue signals innovation; orange accent adds energy." },
    playful: { primary: "#6C63FF", secondary: "#3F3D56", accent: "#FF6584", background: "#F8F9FA", rationale: "Purple-pink palette feels friendly and modern." },
    corporate: { primary: "#003366", secondary: "#336699", accent: "#99CCFF", background: "#FFFFFF", rationale: "Classic corporate blue communicates stability." },
    geometric: { primary: "#0D0D0D", secondary: "#1A1A1A", accent: "#00D9FF", background: "#FFFFFF", rationale: "Near-black with cyan accent feels precise and technical." },
    organic: { primary: "#2D6A4F", secondary: "#40916C", accent: "#95D5B2", background: "#F0FFF4", rationale: "Green tones humanize a tech brand; organic warmth." },
  },
  finance: {
    minimalist: { primary: "#1B2631", secondary: "#2E4057", accent: "#C0A060", background: "#FFFFFF", rationale: "Dark charcoal with gold accent signals premium trust." },
    bold: { primary: "#0A3D62", secondary: "#1A5276", accent: "#F39C12", background: "#FFFFFF", rationale: "Deep blue authority with gold energy." },
    playful: { primary: "#2980B9", secondary: "#3498DB", accent: "#E74C3C", background: "#EBF5FB", rationale: "Approachable blue for consumer-facing fintech." },
    corporate: { primary: "#154360", secondary: "#1A5276", accent: "#AED6F1", background: "#FFFFFF", rationale: "Traditional corporate banking palette." },
    geometric: { primary: "#1B2631", secondary: "#2C3E50", accent: "#D4AC0D", background: "#FDFEFE", rationale: "Geometric precision suits structured financial thinking." },
    organic: { primary: "#1D6A5A", secondary: "#148F77", accent: "#A9DFBF", background: "#EAFAF1", rationale: "Green evokes growth and prosperity." },
  },
  healthcare: {
    minimalist: { primary: "#2E86AB", secondary: "#A23B72", accent: "#F18F01", background: "#FFFFFF", rationale: "Clean blue conveys care and professionalism." },
    bold: { primary: "#E74C3C", secondary: "#C0392B", accent: "#2ECC71", background: "#FFFFFF", rationale: "Medical red with green for health/life." },
    playful: { primary: "#3498DB", secondary: "#85C1E9", accent: "#F9E79F", background: "#EBF5FB", rationale: "Friendly palette for patient-facing brands." },
    corporate: { primary: "#1A5276", secondary: "#154360", accent: "#7FB3D3", background: "#FFFFFF", rationale: "Institutional trust through deep blue." },
    geometric: { primary: "#117A65", secondary: "#148F77", accent: "#A9DFBF", background: "#FDFEFE", rationale: "Clean teal is clinical yet inviting." },
    organic: { primary: "#27AE60", secondary: "#2ECC71", accent: "#A9DFBF", background: "#EAFAF1", rationale: "Natural greens for wellness and vitality." },
  },
  food: {
    minimalist: { primary: "#2C3E50", secondary: "#7F8C8D", accent: "#E67E22", background: "#FDFEFE", rationale: "Dark base with warm orange makes food feel artisanal." },
    bold: { primary: "#E74C3C", secondary: "#C0392B", accent: "#F39C12", background: "#FDFEFE", rationale: "Red + orange is the classic appetite-stimulating combo." },
    playful: { primary: "#F39C12", secondary: "#F1C40F", accent: "#E74C3C", background: "#FFF9E6", rationale: "Warm yellows and reds feel fun and inviting." },
    corporate: { primary: "#1E8449", secondary: "#27AE60", accent: "#F9E79F", background: "#FFFFFF", rationale: "Green signals freshness and health." },
    geometric: { primary: "#2C3E50", secondary: "#E67E22", accent: "#F9E79F", background: "#FDFEFE", rationale: "Structured geometry with warm food tones." },
    organic: { primary: "#784212", secondary: "#935116", accent: "#F0B27A", background: "#FEF9E7", rationale: "Earthy browns for farm-to-table feel." },
  },
  default: {
    minimalist: { primary: "#1A1A1A", secondary: "#4A4A4A", accent: "#007AFF", background: "#FFFFFF", rationale: "Clean neutral palette works across industries." },
    bold: { primary: "#2B4EFF", secondary: "#1A1A2E", accent: "#FF6B35", background: "#FFFFFF", rationale: "High-contrast blue and orange for impact." },
    playful: { primary: "#6C63FF", secondary: "#3F3D56", accent: "#FF6584", background: "#F8F9FA", rationale: "Purple-pink palette feels friendly." },
    corporate: { primary: "#003366", secondary: "#336699", accent: "#99CCFF", background: "#FFFFFF", rationale: "Classic corporate blue." },
    geometric: { primary: "#0D0D0D", secondary: "#1A1A1A", accent: "#00D9FF", background: "#FFFFFF", rationale: "Precise and technical." },
    organic: { primary: "#2D6A4F", secondary: "#40916C", accent: "#95D5B2", background: "#F0FFF4", rationale: "Natural and warm." },
  },
};

function getPalette(industry: string, style: string): Palette {
  const normalizedIndustry = industry.toLowerCase();
  const normalizedStyle = style.toLowerCase();

  const industryKey =
    Object.keys(COLOR_PALETTES).find((k) => normalizedIndustry.includes(k)) ??
    "default";
  const styleKey =
    Object.keys(COLOR_PALETTES[industryKey]).find((k) =>
      normalizedStyle.includes(k)
    ) ?? "minimalist";

  return COLOR_PALETTES[industryKey][styleKey];
}

// ---------------------------------------------------------------------------
// Design inspiration data
// ---------------------------------------------------------------------------

interface DesignInspiration {
  patterns: string[];
  shapes: string[];
  style_notes: string;
}

const DESIGN_INSPIRATION: Record<LogoType, Record<string, DesignInspiration>> = {
  wordmark: {
    technology: { patterns: ["condensed sans-serif", "custom letterforms", "negative space in letters", "varied weight strokes"], shapes: ["letterforms only", "optional thin underline"], style_notes: "Focus on letter spacing and weight. Consider custom ligatures. Google, IBM, and Intel are benchmarks." },
    finance: { patterns: ["serif or small-cap typography", "tight tracking", "monoline strokes"], shapes: ["letterforms with optional thin rule"], style_notes: "Gravitas through typography. Consider small caps or old-style numerals." },
    default: { patterns: ["clean sans-serif", "distinctive font weight", "optical kerning"], shapes: ["text only"], style_notes: "Typography is the entire design. Every letter matters." },
  },
  letterform: {
    technology: { patterns: ["geometric letter construction", "custom path distortion", "negative space cut-outs", "grid-based letterform"], shapes: ["single letter", "circular or square container optional"], style_notes: "Facebook F, Pinterest P: the letter shape IS the brand. Make it unmistakable at 16px." },
    default: { patterns: ["bold single letterform", "unique stroke treatment", "counters as design element"], shapes: ["single letter, oversized"], style_notes: "Strong visual weight. The letter should be recognizable even when heavily stylized." },
  },
  monogram: {
    technology: { patterns: ["interlocking letters", "shared strokes between initials", "geometric grid alignment", "equal visual weight per letter"], shapes: ["2-3 letters in tight composition"], style_notes: "IBM, HP, AWS: initials read as a unit. Consistent stroke width is key." },
    finance: { patterns: ["serif initials", "overlapping letterforms", "classical proportions"], shapes: ["2-3 initials in square or circular arrangement"], style_notes: "Heritage and trust. Consider adding a subtle bounding form." },
    default: { patterns: ["balanced letter pairing", "shared baseline or x-height", "consistent weight"], shapes: ["2-3 letterforms"], style_notes: "Both letters must be legible independently. Test at small sizes." },
  },
  abstract: {
    technology: { patterns: ["geometric primitives", "circuit-inspired nodes", "infinity loops", "tessellation fragments", "orbital arcs"], shapes: ["circle", "triangle", "hexagon", "custom path"], style_notes: "Pepsi, Audi: no literal meaning. Pure form. Use 3-7 geometric shapes max." },
    finance: { patterns: ["upward arrow integrated into shape", "shield fragments", "interlocking rings"], shapes: ["diamond", "shield", "ascending bar form"], style_notes: "Abstract but conveys stability and growth. Avoid anything that looks chaotic." },
    food: { patterns: ["leaf abstraction", "wave/fluid form", "circular energy"], shapes: ["leaf-derived path", "fluid organic curves"], style_notes: "Abstract should still feel warm and approachable for food brands." },
    default: { patterns: ["clean geometric form", "balanced positive/negative space", "unique silhouette"], shapes: ["custom abstract path"], style_notes: "Must have a distinctive silhouette. Test against a white and dark background." },
  },
  combination: {
    technology: { patterns: ["icon left, wordmark right", "icon above wordmark", "icon integrated into a letter"], shapes: ["simple geometric icon + clean text"], style_notes: "Airbnb, Dropbox: icon and text work independently. The icon should be understandable without the text." },
    finance: { patterns: ["shield or arrow icon + name", "monogram icon + full name"], shapes: ["contained icon + serif/sans text"], style_notes: "Icon conveys stability; text provides clarity. Maintain hierarchy." },
    default: { patterns: ["simple icon + legible text", "clear visual separation or integration"], shapes: ["icon (≤5 paths) + wordmark"], style_notes: "Both elements must scale well. Test icon-only and text-only versions mentally." },
  },
  emblem: {
    technology: { patterns: ["badge with inner text", "circular emblem with icon center", "hexagonal badge"], shapes: ["circle", "hexagon", "shield with inner elements"], style_notes: "Everything inside the border. Starbucks, Chrome: the container shape IS part of the brand." },
    finance: { patterns: ["oval or shield crest", "inner text arc around center icon", "classical crest structure"], shapes: ["shield", "oval", "circular with inner ring"], style_notes: "Traditional authority. Inner elements should have clear hierarchy: main icon > name > tagline arc." },
    default: { patterns: ["clean outer border", "centered inner composition", "optional inner ring"], shapes: ["circle or shield container + inner elements"], style_notes: "The border must be thick enough to read at small sizes. All elements must fit comfortably inside." },
  },
};

function getDesignInspiration(
  industry: string,
  logoType: LogoType
): DesignInspiration {
  const typeData = DESIGN_INSPIRATION[logoType];
  const normalizedIndustry = industry.toLowerCase();
  const industryKey =
    Object.keys(typeData).find(
      (k) => k !== "default" && normalizedIndustry.includes(k)
    ) ?? "default";
  return typeData[industryKey] ?? typeData["default"];
}

// ---------------------------------------------------------------------------
// SVG validation (Stage 1 rule-based checks)
// ---------------------------------------------------------------------------

interface ValidateSvgResult {
  valid: boolean;
  errors: string[];
}

function countSvgElements(svg: string): number {
  return (svg.match(/<[a-zA-Z][^/]*?>/g) ?? []).length;
}

function countColors(svg: string): number {
  const colorAttrs = svg.match(/(?:fill|stroke)="([^"]+)"/g) ?? [];
  const colors = new Set<string>();
  for (const attr of colorAttrs) {
    const match = attr.match(/"([^"]+)"/);
    if (match && match[1] !== "none" && match[1] !== "transparent") {
      colors.add(match[1].toLowerCase());
    }
  }
  return colors.size;
}

function hasExternalRefs(svg: string): boolean {
  return /(?:href|src|url)\s*=\s*["'](?!#)[^"']*["']/.test(svg);
}

function hasViewBox(svg: string): boolean {
  return /viewBox\s*=/.test(svg);
}

function getTextElementCount(svg: string): number {
  return (svg.match(/<(?:text|tspan)\b/g) ?? []).length;
}

function getNonTextShapeCount(svg: string): number {
  return (svg.match(/<(?:path|circle|rect|ellipse|polygon|polyline|line|g)\b/g) ?? []).length;
}

function hasOuterContainer(svg: string): boolean {
  return (
    /<(?:circle|rect|ellipse)\b/.test(svg) ||
    /<path[^>]+d="[^"]*Z[^"]*"/i.test(svg)
  );
}

const LOGO_TYPE_RULES: Record<LogoType, (svg: string) => string[]> = {
  wordmark: (svg) => {
    const issues: string[] = [];
    if (getTextElementCount(svg) === 0)
      issues.push("Wordmark must contain <text> or <tspan> elements — typography is the logo.");
    if (countSvgElements(svg) > 30)
      issues.push("Wordmark has too many elements (>30); simplify the design.");
    return issues;
  },
  letterform: (svg) => {
    const issues: string[] = [];
    if (countSvgElements(svg) > 20)
      issues.push("Letterform has too many elements (>20); it should be a single dominant letterform.");
    return issues;
  },
  monogram: (svg) => {
    const issues: string[] = [];
    const textCount = getTextElementCount(svg);
    if (textCount < 2) issues.push("Monogram should have at least 2 text/initial elements.");
    if (textCount > 3) issues.push("Monogram should use 2–3 initials, not more.");
    if (countSvgElements(svg) > 25)
      issues.push("Monogram has too many elements (>25); keep it clean.");
    return issues;
  },
  abstract: (svg) => {
    const issues: string[] = [];
    if (getTextElementCount(svg) > 0)
      issues.push("Abstract logo must not contain text elements.");
    if (getNonTextShapeCount(svg) < 1)
      issues.push("Abstract logo must have at least one shape or path.");
    if (countSvgElements(svg) > 40)
      issues.push("Abstract logo has too many elements (>40); simplify the geometric form.");
    return issues;
  },
  combination: (svg) => {
    const issues: string[] = [];
    if (getTextElementCount(svg) === 0)
      issues.push("Combination logo must include text (the wordmark component).");
    if (getNonTextShapeCount(svg) < 1)
      issues.push("Combination logo must include a symbol/icon component.");
    if (countSvgElements(svg) > 50)
      issues.push("Combination logo has too many elements (>50); simplify.");
    return issues;
  },
  emblem: (svg) => {
    const issues: string[] = [];
    if (!hasOuterContainer(svg))
      issues.push("Emblem must have an outer containing shape (circle, rect, ellipse, or closed path).");
    if (countSvgElements(svg) > 60)
      issues.push("Emblem has too many elements (>60); reduce complexity.");
    return issues;
  },
};

export function validateSvg(svg: string, logoType?: LogoType): ValidateSvgResult {
  const errors: string[] = [];

  if (!hasViewBox(svg)) errors.push("Missing viewBox attribute.");
  if (hasExternalRefs(svg))
    errors.push("SVG contains external references (href/src/url) — must be self-contained.");
  if (countColors(svg) > 5)
    errors.push(`Too many distinct colors (${countColors(svg)}); use 5 or fewer.`);

  if (logoType) {
    errors.push(...LOGO_TYPE_RULES[logoType](svg));
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Logo evaluation (Stage 2 — Claude critic)
// ---------------------------------------------------------------------------

const TYPE_SPECIFIC_CRITERIA: Record<LogoType, string> = {
  wordmark: `Type-specific criteria (7 points):
- Typography uniqueness: does the font feel custom or distinctive, not generic? (2pt)
- Name readability and letter spacing: is it perfectly legible at small sizes? (2pt)
- Text-only constraint: no distracting icons or shapes? (1pt)
- Brand personality through typography: does the font choice reflect the brand adjectives? (2pt)`,

  letterform: `Type-specific criteria (7 points):
- Distinctiveness: is this single letter immediately recognizable and memorable? (3pt)
- Treatment uniqueness: does it go beyond a plain font — custom paths, negative space, unique construction? (2pt)
- Visual weight: is the letterform bold and confident enough to stand alone? (2pt)`,

  monogram: `Type-specific criteria (7 points):
- Legibility: are all initials legible both individually and as a combined unit? (3pt)
- Visual balance: is the composition of the letter pairing harmonious? (2pt)
- Geometric/clean treatment: is the execution clean and structured, not cluttered? (2pt)`,

  abstract: `Type-specific criteria (7 points):
- True abstraction: is the shape non-representational — not a recognizable object in disguise? (2pt)
- Unique silhouette: would this shape be recognizable as a silhouette, separate from color? (2pt)
- Geometric coherence: do the shapes feel intentional and related, not random? (2pt)
- Brand personality: despite being abstract, does it convey the brand adjectives? (1pt)`,

  combination: `Type-specific criteria (7 points):
- Complementarity: do text and symbol enhance each other rather than compete? (2pt)
- Independence: would either element work standalone? (2pt)
- Visual hierarchy: is it clear which element is primary? (2pt)
- Balanced composition: is the overall layout balanced and professional? (1pt)`,

  emblem: `Type-specific criteria (7 points):
- Style appropriateness: does the traditional/badge feel suit the brand adjectives? (2pt)
- Containment: are ALL elements clearly inside the outer border with comfortable padding? (2pt)
- Small-size legibility: at 32px, would border and inner elements still be readable? (2pt)
- Symmetry and balance: is the internal composition centered and harmonious? (1pt)`,
};

export async function evaluateLogo(
  provider: AiProvider,
  svg: string,
  companyName: string,
  industry: string,
  logoType: LogoType,
  style: string,
  targetAudience: string,
  brandAdjectives: string
): Promise<EvaluationResult> {
  // Stage 1: rule-based checks
  const stage1 = validateSvg(svg, logoType);
  if (!stage1.valid) {
    return {
      score: 0,
      strengths: [],
      improvements: stage1.errors,
      rulePassed: false,
      ruleIssues: stage1.errors,
    };
  }

  // Stage 2: model-based critic
  const criticPrompt = `You are an expert logo design critic evaluating an SVG logo.

Brand context:
- Company: ${companyName}
- Industry: ${industry}
- Logo type: ${logoType}
- Style: ${style}
- Target audience: ${targetAudience}
- Brand adjectives: ${brandAdjectives}

Universal criteria (3 points, all logo types):
- Simplicity: uncluttered, immediately readable? (1pt)
- Timelessness: avoids gradients, drop shadows, bevels? (1pt)
- Scalability: works at 16px favicon and 500px banner? (1pt)

${TYPE_SPECIFIC_CRITERIA[logoType]}

SVG to evaluate:
${svg}

Respond with ONLY valid JSON, no markdown fences, no explanation:
{"score":<integer 1-10>,"strengths":["..."],"improvements":["..."]}`;

  const response = await provider.complete({
    maxTokens: 512,
    messages: [{ role: "user", content: criticPrompt }],
  });

  const raw = response.text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const text = jsonMatch ? jsonMatch[0] : raw;
  console.log("[evaluateLogo] raw:", JSON.stringify(raw));

  try {
    const parsed = JSON.parse(text) as {
      score: number;
      strengths: string[];
      improvements: string[];
    };
    return {
      score: parsed.score,
      strengths: parsed.strengths ?? [],
      improvements: parsed.improvements ?? [],
      rulePassed: true,
      ruleIssues: [],
    };
  } catch {
    return {
      score: 5,
      strengths: [],
      improvements: ["Evaluation parsing failed — review manually."],
      rulePassed: true,
      ruleIssues: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Tool dispatcher
// ---------------------------------------------------------------------------

export interface ToolInput {
  name: string;
  input: Record<string, unknown>;
}

export async function executeTool(
  tool: ToolInput,
  provider: AiProvider
): Promise<string> {
  switch (tool.name) {
    case "validate_svg": {
      const { svg, logoType } = tool.input as { svg: string; logoType?: LogoType };
      return JSON.stringify(validateSvg(svg, logoType));
    }

    case "generate_color_palette": {
      const { industry, style, mood } = tool.input as {
        industry: string;
        style: string;
        mood?: string;
      };
      return JSON.stringify({ ...getPalette(industry, style), mood: mood ?? null });
    }

    case "get_design_inspiration": {
      const { industry, logoType } = tool.input as {
        industry: string;
        logoType: LogoType;
      };
      return JSON.stringify(getDesignInspiration(industry, logoType));
    }

    case "evaluate_logo": {
      const {
        svg,
        companyName,
        industry,
        logoType,
        style,
        targetAudience,
        brandAdjectives,
      } = tool.input as {
        svg: string;
        companyName: string;
        industry: string;
        logoType: LogoType;
        style: string;
        targetAudience: string;
        brandAdjectives: string;
      };
      return JSON.stringify(
        await evaluateLogo(
          provider, svg, companyName, industry,
          logoType, style, targetAudience, brandAdjectives
        )
      );
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${tool.name}` });
  }
}
