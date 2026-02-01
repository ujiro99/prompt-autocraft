import { cn } from "@/lib/utils"
import type { ImproveLog } from "@/services/promptImprover/improverService"
import { i18n } from "#imports"

interface ImprovementExplanationCardProps {
  improvement: ImproveLog
  index: number
  isHovered: boolean
  onHover: (index: number | null) => void
  onClick: () => void
  cardRef: (el: HTMLDivElement | null) => void
}

export const ImprovementExplanationCard: React.FC<
  ImprovementExplanationCardProps
> = ({ improvement, index, isHovered, onHover, onClick, cardRef }) => {
  const lineRange =
    improvement.start_line === improvement.end_line
      ? i18n.t("dialogs.promptImprove.singleLine", [improvement.start_line])
      : i18n.t("dialogs.promptImprove.lineRange", [
          improvement.start_line,
          improvement.end_line,
        ])

  return (
    <div
      ref={cardRef}
      className={cn(
        "border rounded-lg p-4 bg-card cursor-pointer transition-all duration-200",
        "hover:border-primary hover:shadow-lg hover:scale-[1.02]",
        isHovered && "border-primary shadow-lg scale-[1.02]",
      )}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="text-sm font-semibold text-primary">{lineRange}</div>
        <div className="text-sm text-foreground">{improvement.description}</div>
        <div className="text-xs text-muted-foreground">
          {improvement.benefit}
        </div>
      </div>
    </div>
  )
}
