import type { ImproveLog } from "@/services/promptImprover/improverService"
import { ImprovementExplanationCard } from "./ImprovementExplanationCard"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ImprovementExplanationPanelProps {
  improvements: ImproveLog[]
  hoveredIndex: number | null
  onHoverChange: (index: number | null) => void
  onImprovementClick: (startLine: number, endLine: number) => void
  cardRefs: React.RefObject<(HTMLDivElement | null)[]>
}

export const ImprovementExplanationPanel: React.FC<
  ImprovementExplanationPanelProps
> = ({
  improvements,
  hoveredIndex,
  onHoverChange,
  onImprovementClick,
  cardRefs,
}) => {
  return (
    <div className="w-[400px] space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        {i18n.t("dialogs.promptImprove.explanationTitle")}
      </h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {improvements.map((improvement, index) => (
            <ImprovementExplanationCard
              key={index}
              improvement={improvement}
              index={index}
              isHovered={hoveredIndex === index}
              onHover={onHoverChange}
              onClick={() =>
                onImprovementClick(improvement.start_line, improvement.end_line)
              }
              cardRef={(el) => {
                if (cardRefs.current) {
                  cardRefs.current[index] = el
                }
              }}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
