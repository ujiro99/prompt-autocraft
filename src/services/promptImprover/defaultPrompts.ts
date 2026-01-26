/**
 * Default Prompts for Prompt Improvement
 *
 * This file contains the default prompts used by the Prompt Improver service.
 * These prompts are separated for transparency and easy reference.
 */

/**
 * Fixed system prompt (defines AI's role and critical rules)
 *
 * This defines the fundamental role of the AI and critical rules it must follow.
 * This is NOT user-configurable and remains fixed to ensure consistent behavior.
 *
 * Key responsibilities:
 * - Define the AI's identity as a prompt engineering assistant
 * - Establish critical rules to prevent direct answers
 * - Focus on prompt improvement rather than answering questions
 */
export const SYSTEM_INSTRUCTION = `You are an expert prompt engineering assistant.
Your role is to improve user prompts to make them more effective.

CRITICAL RULES:
- Do NOT answer the user's question directly
- Focus on improving the structure, clarity, and effectiveness of the prompt itself
- Output prompts in the same language as the user prompt
- Output explanations in language code: ${chrome.i18n.getUILanguage()}`

/**
 * Default improvement prompt (fallback)
 *
 * These propmt define HOW the AI should improve prompts.
 * This CAN be customized by users via settings (text input or URL).
 */
export const DEFAULT_IMPROVEMENT_PROMPT_old = `Analyze and improve the following user prompt using these guidelines:

1. Maintain the original intent and purpose
2. Clarify any ambiguous expressions
3. Add appropriate structure (bullets, sections)
4. Consider adding: persona, constraints, examples, or output format specifications
5. Keep the improved prompt concise and focused

Apply improvements based on the prompt's characteristics (simple/complex, technical/general).`

export const DEFAULT_IMPROVEMENT_PROMPT = `
Analyze and improve the following user prompt based on these guidelines and reporting requirements.

# 1. Improvement Guidelines
  - Maintain Intent: Preserve the original goal and core purpose.
  - Clarify: Remove ambiguity and use precise terminology.
  - Structure: Use Markdown (headers, bullets, sections) for readability.
  - Add Components: Incorporate a persona, clear constraints, few-shot examples, or specific output formats where beneficial.
  - Conciseness: Ensure the improved prompt is focused and lacks redundancy.

# 2. Reporting Requirements
  For every modification made to the original prompt, you must provide a detailed change log:
  - changeLog:
    - start_line: modified line number in the improved prompt
    - end_line: modified line number in the improved prompt
    - description: Describe what specifically was modified (≤40 characters preferred)
    - benefit: Explain how this change improves the output quality or user experience

# 3. Execution
  Apply these improvements based on the prompt's characteristics (simple/complex, technical/general). Output the Improved Prompt first, followed by the Change Log.
`
