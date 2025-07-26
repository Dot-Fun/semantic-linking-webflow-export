import Anthropic from "@anthropic-ai/sdk";

interface AnalysisResult {
  shouldLink: boolean;
  linkText: string;
  altText: string;
  confidence: number;
  reasoning: string;
  linkPosition?: number;
}

export class SemanticAnalyzer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }

  async analyzeSemanticLink(
    sourceContent: string,
    targetContent: string,
    sourceName: string,
    targetName: string
  ): Promise<AnalysisResult> {
    const prompt = `You are a conservative semantic link analyst. Most pages should NOT have links added unless there's a compelling reason.

Source Post: "${sourceName}"
Target Post: "${targetName}"

SOURCE CONTENT:
<source-content>
${sourceContent}
</source-content>

TARGET CONTENT:
<target-content>
${targetContent}
</target-content>

CRITICAL: Be highly selective. Only suggest a link if ALL these criteria are met:
1. STRONG SEMANTIC RELEVANCE - The source directly discusses concepts that the target page explains in detail
2. USER VALUE - A reader would genuinely benefit from accessing the target content at that specific point
3. NATURAL CONTEXT - The surrounding text naturally leads to needing the information in the target
4. SPECIFIC CONNECTION - Not just generic mentions of broad topics
5. CLEAR USER INTENT - The link helps users accomplish their specific goal on the source page
6. NO EXISTING LINK - The text you want to link MUST NOT already be part of a link to any URL
7. LINK TEXT LENGTH - The text to be linked MUST be 2-4 words only (e.g., "SBA loan", "buy a business", "loan application")

IMPORTANT: The source content may contain HTML. Look for existing links in the format <a href="...">text</a>.

Default to "No suitable location for semantic link" unless there's exceptional relevance.

Respond with ONLY a JSON object:
{
  "shouldLink": true/false,
  "linkText": "exact 2-4 word text where link should be placed",
  "altText": "best in class SEO alt text for the link",
  "confidence": 0-100 (only suggest if 70%+ confident),
  "reasoning": "Brief explanation",
  "linkPosition": approximate character position in source content where link should go (optional)
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      // Extract JSON from response
      const content = response.content[0];
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          
          // Only return links with high confidence
          if (result.shouldLink && result.confidence >= 70) {
            return {
              shouldLink: true,
              linkText: result.linkText || "",
              altText: result.altText || "",
              confidence: result.confidence,
              reasoning: result.reasoning || "",
              linkPosition: result.linkPosition
            };
          }
        }
      }

      return {
        shouldLink: false,
        linkText: "",
        altText: "",
        confidence: 0,
        reasoning: "No suitable location for semantic link"
      };
    } catch (error) {
      console.error("Error analyzing with Claude:", error);
      throw new Error("Failed to analyze semantic link");
    }
  }

  /**
   * Find the exact position of link text in content
   */
  findLinkPosition(content: string, linkText: string): number {
    // First try exact match
    let position = content.indexOf(linkText);
    if (position !== -1) return position;

    // Try case-insensitive match
    const lowerContent = content.toLowerCase();
    const lowerLinkText = linkText.toLowerCase();
    position = lowerContent.indexOf(lowerLinkText);
    
    return position;
  }

  /**
   * Check if text at position is already part of a link
   */
  isAlreadyLinked(content: string, position: number, length: number): boolean {
    // Look for <a> tags before and after the position
    const beforeText = content.substring(0, position);
    const afterText = content.substring(position + length);
    
    // Check if we're inside an <a> tag
    const lastOpenTag = beforeText.lastIndexOf("<a ");
    const lastCloseTag = beforeText.lastIndexOf("</a>");
    
    if (lastOpenTag > lastCloseTag) {
      // We have an unclosed <a> tag before our position
      // Check if it closes after our position
      const nextCloseTag = afterText.indexOf("</a>");
      if (nextCloseTag !== -1) {
        return true; // We're inside a link
      }
    }
    
    return false;
  }
}