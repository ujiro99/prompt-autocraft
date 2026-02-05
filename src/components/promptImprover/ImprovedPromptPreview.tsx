import { useRef } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ImproveLog } from "@/services/promptImprover/improverService"
import { LineHighlightOverlay } from "./LineHighlightOverlay"
import { ConnectingLines } from "./ConnectingLines"
import {
  ImprovementExplanationTitle,
  ImprovementExplanationPanel,
} from "./ImprovementExplanationPanel"
import { useScrollSync } from "./useScrollSync"

/**
 * Props for ImprovedPromptPreviewSection
 */
interface ImprovedPromptPreviewProps {
  /** Label text for the preview section */
  label: string
  /** Improved prompt content */
  improvedContent: string
  /** Whether improvement is in progress */
  isImproving: boolean
  /** Improvement error message */
  improvementError: string | null
  /** Change log from improvement */
  changeLog: ImproveLog[]
  /** Currently hovered improvement index */
  hoveredIndex: number | null
  /** Callback when hover state changes */
  onHoverChange: (index: number | null) => void
  /** Callback to trigger improvement */
  onImprove: () => void
  /** Callback to cancel improvement */
  onCancelImprovement: () => void
  /** Whether the improve button is disabled */
  disabled?: boolean
  /** Whether API key is configured */
  isApiKeyConfigured?: boolean
  /** Text for improve button */
  improveButtonText?: string
  /** Text for cancel button */
  cancelButtonText?: string
  /** Placeholder text during improvement */
  improvingPlaceholder?: string
  /** Additional class name for the component */
  className?: string
}

/**
 * Improved prompt preview section component
 * Displays the improved prompt with highlights, connecting lines, and explanation cards
 */
export const ImprovedPromptPreview: React.FC<ImprovedPromptPreviewProps> = ({
  label,
  improvedContent,
  isImproving,
  improvementError,
  changeLog,
  hoveredIndex,
  onHoverChange,
  onImprove,
  onCancelImprovement,
  disabled = false,
  isApiKeyConfigured = true,
  improveButtonText = "Improve with AI",
  cancelButtonText = "Cancel",
  improvingPlaceholder = "Improving...",
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  // Synchronize scrolling between textarea and improvement panel
  useScrollSync({
    textareaRef,
    panelRef,
    cardRefs,
    improvements: changeLog,
    enabled: changeLog.length > 0,
  })

  /**
   * Scroll to specific line in the textarea
   */
  const handleScrollToLine = (startLine: number, _endLine: number) => {
    if (!textareaRef.current) return

    // Calculate line height
    const computedStyle = getComputedStyle(textareaRef.current)
    const lineHeight = parseFloat(computedStyle.lineHeight) || 20

    // Calculate target position (center the range in viewport)
    const targetScrollTop =
      (startLine - 1) * lineHeight - textareaRef.current.clientHeight / 2

    // Smooth scroll
    textareaRef.current.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: "smooth",
    })
  }

  return (
    <div className={cn("flex flex-col space-y-1 h-[400px]", className)}>
      <div className="grid grid-cols-[2fr_50px_1fr] gap-1 items-end">
        <label className="text-base font-semibold text-foreground">
          {label}
        </label>
        <div />
        <ImprovementExplanationTitle />
      </div>

      {improvementError ? (
        <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-md border border-destructive/20">
          {improvementError}
        </div>
      ) : (
        <div
          className={cn(
            "flex-1 overflow-hidden",
            changeLog.length > 0 && "grid grid-cols-[2fr_50px_1fr] ",
          )}
        >
          {/* Left: Improved prompt with overlay */}
          <div className="relative overflow-hidden p-1">
            <Textarea
              ref={textareaRef}
              value={improvedContent}
              readOnly
              className="h-full bg-muted/50 font-mono"
              rows={6}
              placeholder={isImproving ? improvingPlaceholder : ""}
            />
            {changeLog.length > 0 && (
              <LineHighlightOverlay
                improvements={changeLog}
                hoveredIndex={hoveredIndex}
                textareaRef={textareaRef}
              />
            )}
            {improvedContent.trim() === "" && !isImproving && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-background/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onImprove}
                  className={cn(
                    "flex items-center",
                    "bg-gradient-to-r from-purple-50 to-blue-50",
                    "border-purple-200 hover:border-purple-300",
                    "hover:from-purple-100 hover:to-blue-100",
                    "text-purple-700 hover:text-purple-800",
                    "transition-all duration-200",
                  )}
                  disabled={disabled || !isApiKeyConfigured}
                >
                  <Sparkles
                    className="mr-0.5 size-4"
                    fill="url(#lucideGradient)"
                  />
                  {improveButtonText}
                </Button>
              </div>
            )}
            {isImproving && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-background/50">
                <Loader2 className="ml-5 size-6 animate-spin text-primary" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancelImprovement}
                  className="text-xs"
                >
                  {cancelButtonText}
                </Button>
              </div>
            )}
          </div>

          {/* Middle: Connecting lines */}
          {changeLog.length > 0 && (
            <div className="relative">
              <ConnectingLines
                improvements={changeLog}
                textareaRef={textareaRef}
                explanationPanelRef={panelRef}
                cardRefs={cardRefs}
                hoveredIndex={hoveredIndex}
                promptContent={improvedContent}
              />
            </div>
          )}

          {/* Right: Explanation cards */}
          {changeLog.length > 0 && (
            <ImprovementExplanationPanel
              improvements={changeLog}
              hoveredIndex={hoveredIndex}
              onHoverChange={onHoverChange}
              onImprovementClick={handleScrollToLine}
              containerRef={panelRef}
              cardRefs={cardRefs}
            />
          )}
        </div>
      )}
    </div>
  )
}
