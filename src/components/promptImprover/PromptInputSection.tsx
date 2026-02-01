import { Textarea } from "@/components/ui/textarea"

/**
 * Props for PromptInputSection
 */
interface PromptInputSectionProps {
  /** Prompt content value */
  content: string
  /** Callback when content changes */
  onChange: (content: string) => void
  /** Label text for the input */
  label: string
  /** Placeholder text */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Number of rows for the textarea */
  rows?: number
}

/**
 * Prompt input section component
 * Displays a labeled textarea for entering prompt content
 */
export const PromptInputSection: React.FC<PromptInputSectionProps> = ({
  content,
  onChange,
  label,
  placeholder = "",
  disabled = false,
  rows = 6,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="prompt-content"
          className="text-sm font-semibold text-foreground"
        >
          {label}
        </label>
      </div>
      <Textarea
        id="prompt-content"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="max-h-60"
        rows={rows}
      />
    </div>
  )
}
