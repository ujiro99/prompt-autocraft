import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Settings } from "lucide-react"
import type { VariableConfig } from "@/types/prompt"
import { VariableExpansionInfoDialog } from "@/components/inputMenu/controller/VariableExpansionInfoDialog"
import { PromptImproverSettingsDialog } from "@/components/settings/PromptImproverSettingsDialog"
import { ModelSettingsDialog } from "@/components/settings/ModelSettingsDialog"
import { ApiKeyWarningBanner } from "@/components/shared/ApiKeyWarningBanner"
import type { ImproveLog } from "@/services/promptImprover/improverService"
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { useContainer } from "@/hooks/useContainer"
import { useSettings } from "@/hooks/useSettings"
import { useAiModel } from "@/hooks/useAiModel"
import { analyticsService, ANALYTICS_EVENTS } from "@/services/analytics"
import { ImprovePromptData } from "@/types/prompt"
import { ImproverService } from "@/services/promptImprover/improverService"
import { stopPropagation } from "@/utils/dom"
import { mergeVariableConfigs } from "@/utils/variables/variableParser"
import { improvePromptSettingsStorage } from "@/services/storage/definitions"
import { PromptInputSection } from "./PromptInputSection"
import { ImprovedPromptPreview } from "./ImprovedPromptPreview"
import { i18n } from "#imports"
import { getUILanguage } from "@/utils/browser"

/**
 * Props for prompt edit dialog
 */
interface PromptImproveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Initial data */
  initialData: ImprovePromptData
  /** Callback on save */
  onInput: (data: ImprovePromptData) => Promise<void>
}

/**
 * Prompt save/edit dialog component
 */
export const PromptImproverDialog: React.FC<PromptImproveDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  onInput,
}) => {
  const initialContent = initialData.content
  const initialVariables = initialData.variables
  const [content, setContent] = useState(initialData.content)
  const [variables, setVariables] = useState<VariableConfig[]>(
    initialVariables || [],
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  const { container } = useContainer()
  const { settings } = useSettings()

  const { genaiApiKey } = useAiModel()
  const isApiKeyConfigured = Boolean(genaiApiKey)

  // Prompt improvement states
  const [improvedContent, setImprovedContent] = useState("")
  const [isImproving, setIsImproving] = useState(false)
  const [improvementError, setImprovementError] = useState<string | null>(null)
  const promptImproverRef = useRef<ImproverService | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [modelSettingsDialogOpen, setModelSettingsDialogOpen] = useState(false)
  const [changeLog, setChangeLog] = useState<ImproveLog[]>([])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Check if variable expansion is enabled (default: true)
  const variableExpansionEnabled = settings?.variableExpansionEnabled ?? true

  const cancelImprovement = useCallback(() => {
    if (isImproving && promptImproverRef.current) {
      promptImproverRef.current.cancel()
      setIsImproving(false)
    }
  }, [isImproving])

  // Initialize PromptImprover
  useEffect(() => {
    if (!promptImproverRef.current) {
      promptImproverRef.current = new ImproverService(getUILanguage())
      promptImproverRef.current.loadSettings()

      // Watch for settings changes
      return improvePromptSettingsStorage.watch(() => {
        promptImproverRef.current?.loadSettings().catch((error) => {
          console.error("Failed to load prompt improver settings:", error)
        })
      })
    }
  }, [])

  // Update initial values
  useEffect(() => {
    setContent(initialContent)
    setVariables(
      variableExpansionEnabled
        ? initialVariables || mergeVariableConfigs(initialContent)
        : [],
    )
  }, [initialContent, initialVariables, variableExpansionEnabled])

  // Clear values on close
  useEffect(() => {
    if (!open) {
      setContent(initialContent)
      setVariables(initialVariables || [])
      setImprovedContent("")
      setImprovementError(null)
      setChangeLog([])
      setHoveredIndex(null)
      // Cancel ongoing improvement if any
      cancelImprovement()
    }
  }, [open, initialContent, initialVariables, cancelImprovement])

  // cleanup function
  useEffect(() => {
    return () => {
      // Stop any ongoing improvement on unmount
      cancelImprovement()
    }
  }, [cancelImprovement])

  // Parse and merge variables when content changes (only if variable expansion is enabled)
  useEffect(() => {
    if (variableExpansionEnabled) {
      setVariables((prevVariables) =>
        mergeVariableConfigs(content, prevVariables),
      )
    } else {
      setVariables([])
    }
  }, [content, variableExpansionEnabled])

  /**
   * Improve prompt using Gemini AI
   */
  const handleImprove = async () => {
    if (!content.trim() || !promptImproverRef.current) {
      return
    }

    setIsImproving(true)
    setImprovedContent("")
    setImprovementError(null)

    try {
      await promptImproverRef.current.improvePrompt({
        prompt: content,
        onStream: (chunk) => {
          setImprovedContent((prev) => prev + chunk)
        },
        onComplete: (improved, logs) => {
          setIsImproving(false)
          setImprovedContent(improved)
          setChangeLog(logs || [])
        },
        onError: (error) => {
          setIsImproving(false)
          setImprovementError(error.message)
          console.error("Prompt improvement error:", error)
        },
      })

      await analyticsService.track(ANALYTICS_EVENTS.IMPROVE_PROMPT)
    } catch (error) {
      setIsImproving(false)
      setImprovementError(
        error instanceof Error ? error.message : "Unknown error occurred",
      )
      console.error("Prompt improvement error:", error)
    }
  }

  /**
   * Cancel improvement and close preview
   */
  const handleCancelImprovement = () => {
    cancelImprovement()
    setImprovedContent("")
    setImprovementError(null)
  }

  /**
   * Open model settings dialog
   */
  const handleOpenModelSettings = () => {
    setModelSettingsDialogOpen(true)
  }

  /**
   * Input processing
   */
  const handleInput = async () => {
    setIsLoading(true)

    try {
      // Use improved content if available, otherwise use current content
      const contentToUse = improvedContent.trim() || content.trim()

      const improvedData: ImprovePromptData = {
        content: contentToUse,
        variables: variables,
      }

      await analyticsService.track(ANALYTICS_EVENTS.SET_INPROVED_PROMPT)
      await onInput(improvedData)
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  /**
   * Keyboard event handling
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      handleInput()
    }
    // Prevent propagation to avoid unwanted side effects on AI service input
    event.persist()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          container={container}
          className={cn(
            "max-h-9/10",
            changeLog.length > 0 ? "w-full max-w-6xl" : "w-xl sm:max-w-xl",
          )}
          onKeyDown={handleKeyDown}
          {...stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <DialogHeader className="flex-1">
              <DialogTitle>{i18n.t("dialogs.promptImprove.title")}</DialogTitle>
              <DialogDescription>
                {i18n.t("dialogs.promptImprove.message")}
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={() => setSettingsDialogOpen(true)}
              variant="ghost"
              size="sm"
              className="group mr-1"
            >
              <Settings className="size-5 stroke-neutral-600 group-hover:stroke-neutral-800" />
            </Button>
          </div>

          {/* API Key Warning */}
          {!isApiKeyConfigured && (
            <ApiKeyWarningBanner
              variant="destructive"
              onOpenSettings={handleOpenModelSettings}
            />
          )}

          <div className="space-y-4">
            {/* Prompt content input */}
            <PromptInputSection
              content={content}
              onChange={setContent}
              label={i18n.t("dialogs.promptImprove.promptTitle")}
              placeholder={i18n.t("placeholders.enterPromptContent")}
              disabled={isLoading || isImproving}
            />

            {/* Preview area for improved prompt */}
            <ImprovedPromptPreview
              label={i18n.t("dialogs.promptImprove.previewTitle")}
              improvedContent={improvedContent}
              isImproving={isImproving}
              improvementError={improvementError}
              changeLog={changeLog}
              hoveredIndex={hoveredIndex}
              onHoverChange={setHoveredIndex}
              onImprove={handleImprove}
              onCancelImprovement={handleCancelImprovement}
              disabled={isLoading || !content.trim()}
              isApiKeyConfigured={isApiKeyConfigured}
              improveButtonText={i18n.t("dialogs.promptImprove.improveButton")}
              cancelButtonText={i18n.t("common.cancel")}
              improvingPlaceholder={i18n.t("dialogs.promptImprove.improving")}
            />
          </div>

          <DialogFooter className="mt-3">
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {i18n.t("common.cancel")}
            </Button>
            <ButtonGroup>
              <Button
                onClick={handleInput}
                disabled={
                  isLoading ||
                  (!content.trim() && !improvedContent.trim()) ||
                  isImproving
                }
              >
                {i18n.t("common.input")}
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <VariableExpansionInfoDialog
        open={isInfoDialogOpen}
        onOpenChange={setIsInfoDialogOpen}
      />
      <ModelSettingsDialog
        open={modelSettingsDialogOpen}
        onOpenChange={setModelSettingsDialogOpen}
      />
      <PromptImproverSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        onClickModelSettings={() => {
          setSettingsDialogOpen(false)
          setModelSettingsDialogOpen(true)
        }}
      />
    </>
  )
}
