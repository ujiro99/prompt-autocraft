/**
 * Tests for PromptImprover
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { ImproverService } from "../improverService"

// ============================================
// Service-specific Mocks
// ============================================

// Create mocks for GeminiClient
const mockInitialize = vi.fn()
const mockIsInitialized = vi.fn()
const mockGenerateStructuredContentStream = vi.fn()

// Mock GeminiClient module
vi.mock("../../genai/GeminiClient", () => ({
  GeminiClient: {
    getInstance: () => ({
      initialize: mockInitialize,
      isInitialized: mockIsInitialized,
      generateStructuredContentStream: mockGenerateStructuredContentStream,
    }),
  },
}))

describe("PromptImprover", () => {
  let improver: ImproverService

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsInitialized.mockReturnValue(true)
    improver = new ImproverService("en")
  })

  describe("improvePrompt", () => {
    it("should call onError when prompt is empty", async () => {
      const onError = vi.fn()

      await improver.improvePrompt({
        prompt: "",
        onError,
      })

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Prompt cannot be empty",
        }),
      )
    })

    it("should call onStream for each chunk", async () => {
      const onStream = vi.fn()
      const onComplete = vi.fn()

      // Mock structured response that calls onProgress with chunks
      mockGenerateStructuredContentStream.mockImplementation(
        async (_userContent, _schema, _config, options) => {
          // Simulate streaming via onProgress callback
          options?.onProgress?.("chunk1")
          options?.onProgress?.("chunk2")
          options?.onProgress?.("chunk3")

          // Return final structured response
          return {
            improvedPrompt: "improved prompt",
            changeLog: [],
          }
        },
      )

      await improver.improvePrompt({
        prompt: "test prompt",
        onStream,
        onComplete,
      })

      expect(onStream).toHaveBeenCalledTimes(3)
      expect(onStream).toHaveBeenNthCalledWith(1, "chunk1")
      expect(onStream).toHaveBeenNthCalledWith(2, "chunk2")
      expect(onStream).toHaveBeenNthCalledWith(3, "chunk3")
    })

    it("should call onComplete with full improved prompt", async () => {
      const onComplete = vi.fn()

      // Mock structured response
      mockGenerateStructuredContentStream.mockImplementation(
        async (_userContent, _schema, _config, options) => {
          // Simulate streaming via onProgress callback
          options?.onProgress?.("improved ")
          options?.onProgress?.("prompt ")
          options?.onProgress?.("text")

          // Return final structured response
          return {
            improvedPrompt: "improved prompt text",
            changeLog: [],
          }
        },
      )

      await improver.improvePrompt({
        prompt: "test prompt",
        onComplete,
      })

      expect(onComplete).toHaveBeenCalledWith("improved prompt text", [])
    })

    it("should call onError when stream fails", async () => {
      const onError = vi.fn()

      mockGenerateStructuredContentStream.mockRejectedValue(
        new Error("Stream error"),
      )

      await improver.improvePrompt({
        prompt: "test prompt",
        onError,
      })

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it("should pass system instruction to client", async () => {
      // Mock structured response
      mockGenerateStructuredContentStream.mockResolvedValue({
        improvedPrompt: "improved",
        changeLog: [],
      })

      await improver.improvePrompt({
        prompt: "test prompt",
      })

      // Verify that user content includes improvement guidelines and user prompt
      expect(mockGenerateStructuredContentStream).toHaveBeenCalledWith(
        expect.stringContaining("Analyze and improve"),
        expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            improvedPrompt: expect.any(Object),
            changeLog: expect.any(Object),
          }),
        }),
        expect.objectContaining({
          systemInstruction: expect.stringContaining(
            "expert prompt engineering assistant",
          ),
        }),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          onProgress: expect.any(Function),
        }),
      )
      // Verify user prompt is wrapped in tags
      const userContent = mockGenerateStructuredContentStream.mock.calls[0][0]
      expect(userContent).toContain("<user_prompt>")
      expect(userContent).toContain("test prompt")
      expect(userContent).toContain("</user_prompt>")
    })
  })

  describe("cancel", () => {
    it("should cancel ongoing operation", () => {
      // Just ensure it doesn't throw
      expect(() => improver.cancel()).not.toThrow()
    })
  })
})
