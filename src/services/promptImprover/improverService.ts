/**
 * Prompt Improver Service
 * Business logic for improving prompts using Gemini AI
 */

import { GeminiClient } from "../genai/GeminiClient"
import type { ImproveOptions } from "../genai/types"
import { GeminiError, GeminiErrorType } from "../genai/types"
import { improvePromptCacheService } from "../storage/improvePromptCache"
import { improvePromptSettingsStorage } from "../storage/definitions"
import {
  SYSTEM_INSTRUCTION,
  DEFAULT_IMPROVEMENT_PROMPT,
} from "./defaultPrompts"

/**
 * Default timeout in milliseconds (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000

export interface ImproveLog {
  start_line: number
  end_line: number
  description: string
  benefit: string
}

export interface ImproveResponse {
  improvedPrompt: string
  changeLog: ImproveLog[]
}

/**
 * Prompt Improve Service
 */
export class ImproverService {
  private client: GeminiClient
  private abortController: AbortController | null = null
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private systemInstruction: string = SYSTEM_INSTRUCTION // Fixed role definition
  private improvementPrompt: string = DEFAULT_IMPROVEMENT_PROMPT // User-configurable

  constructor() {
    this.client = GeminiClient.getInstance()
    // Load settings asynchronously
    this.loadSettings().catch((error) => {
      console.warn("Failed to load settings:", error)
    })
  }

  /**
   * Load settings from storage (improvement prompt)
   * Note: API key initialization is handled by AiModelContext
   */
  public async loadSettings(): Promise<void> {
    console.log("Loading Prompt Improver settings...")

    // Load improvement prompt with priority logic
    await this.loadImprovementPromptWithPriority()
  }

  /**
   * Improve a prompt using Gemini AI
   * @param options - Improvement options including callbacks
   */
  public async improvePrompt(options: ImproveOptions): Promise<void> {
    const { prompt, onStream, onComplete, onError } = options

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      const error = new GeminiError(
        "Prompt cannot be empty",
        GeminiErrorType.API_ERROR,
      )
      onError?.(error)
      return
    }

    // Check if API key is configured
    if (!this.client.isInitialized()) {
      const error = new GeminiError(
        "API key not configured. Please set your API key in settings.",
        GeminiErrorType.API_KEY_MISSING,
      )
      onError?.(error)
      return
    }

    // Create abort controller for cancellation
    this.abortController = new AbortController()

    // Setup timeout
    this.timeoutId = setTimeout(() => {
      this.cancel()
      const error = new GeminiError(
        "Request timed out. Please try again.",
        GeminiErrorType.TIMEOUT,
      )
      onError?.(error)
    }, DEFAULT_TIMEOUT)

    try {
      // Combine improvement prompt with user prompt
      const userContent = `${this.improvementPrompt}

<user_prompt>
${prompt}
</user_prompt>`

      const schema = {
        type: "object",
        properties: {
          improvedPrompt: {
            type: "string",
            description: "The improved version of the user's prompt.",
          },
          changeLog: {
            type: "array",
            items: {
              type: "object",
              properties: {
                start_line: {
                  type: "integer",
                },
                end_line: {
                  type: "integer",
                },
                description: {
                  type: "string",
                },
                benefit: {
                  type: "string",
                },
              },
              required: ["start_line", "end_line", "description", "benefit"],
            },
          },
        },
      }

      const config = {
        systemInstruction: this.systemInstruction,
      }

      const response =
        await this.client.generateStructuredContentStream<ImproveResponse>(
          userContent,
          schema,
          config,
          {
            signal: this.abortController.signal,
            onProgress: (chunkText) => {
              onStream?.(chunkText || "")
            },
          },
        )

      // debug logs
      console.log("prompt:", response.improvedPrompt)
      response.changeLog.forEach((log, index) => {
        console.log(
          `- [${index + 1}] ${log.description}:\n  Lines ${log.start_line}-${log.end_line}\n  Benefit: ${log.benefit}\n\n`,
        )
      })

      const improvedPrompt = response.improvedPrompt

      // Clear timeout on successful completion
      this.clearTimeout()

      // Call completion callback
      onComplete?.(improvedPrompt, response.changeLog)
    } catch (error) {
      // Clear timeout on error
      this.clearTimeout()

      // Call error callback
      onError?.(error as Error)
    } finally {
      // Cleanup
      this.abortController = null
    }
  }

  /**
   * Cancel the current improvement operation
   */
  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.clearTimeout()
  }

  /**
   * Clear the timeout
   */
  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  /**
   * Load improvement prompt with priority logic
   * Priority (all users):
   * 1. User text setting (mode === 'text')
   * 2. User URL setting (mode === 'url') → cache → fetch
   * 3. Environment variable URL → cache → fetch
   * 4. Default prompt
   *
   * Note: systemInstruction remains fixed as SYSTEM_ROLE
   */
  private async loadImprovementPromptWithPriority(): Promise<void> {
    // Load user settings
    const settings = await improvePromptSettingsStorage.getValue()

    // 1. User text setting
    if (settings.mode === "text" && settings.textContent.trim() !== "") {
      this.improvementPrompt = settings.textContent
      return
    }

    // 2. User URL setting
    if (settings.mode === "url" && settings.urlContent.trim() !== "") {
      const prompt = await this.fetchFromUrl(settings.urlContent)
      if (prompt) {
        this.improvementPrompt = prompt
        return
      }
    }

    // 3. Environment variable URL (all users)
    const envUrl = import.meta.env.WXT_IMPROVE_PROMPT_URL
    if (envUrl) {
      const prompt = await this.fetchFromUrl(envUrl)
      if (prompt) {
        this.improvementPrompt = prompt
        return
      }
    }

    // 4. Fallback to default
    this.improvementPrompt = DEFAULT_IMPROVEMENT_PROMPT
  }

  /**
   * Fetch improvement prompt from URL with cache support
   * Fallback chain: Today's cache → Fetch from URL → Latest cache
   */
  private async fetchFromUrl(url: string): Promise<string | null> {
    // 1. Try today's cache
    const cached = await improvePromptCacheService.getTodaysCache()
    if (cached) {
      return cached
    }

    // 2. Try fetch from URL
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }
      const prompt = await response.text()
      // Save to cache
      await improvePromptCacheService.saveCache(prompt)
      return prompt
    } catch (error) {
      console.warn("Failed to fetch prompt from URL:", error)
    }

    // 3. Fallback to latest cache
    const latestCache = await improvePromptCacheService.getLatestCache()
    if (latestCache) {
      return latestCache
    }

    return null
  }
}
