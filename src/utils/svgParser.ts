export function extractSvg(text: string): string | null {
  const fenceMatch = text.match(/```(?:svg|xml)?\s*(<svg[\s\S]*?<\/svg>)\s*```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  const directMatch = text.match(/<svg[\s\S]*<\/svg>/i);
  if (directMatch) return directMatch[0].trim();

  return null;
}
