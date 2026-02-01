import type { ImproveLog } from "@/services/promptImprover/improverService"
import { ImprovementExplanationCard } from "./ImprovementExplanationCard"
import { ScrollArea } from "@/components/ui/scroll-area"
import { i18n } from "#imports"

interface ImprovementExplanationPanelProps {
  improvements: ImproveLog[]
  hoveredIndex: number | null
  onHoverChange: (index: number | null) => void
  onImprovementClick: (startLine: number, endLine: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  cardRefs: React.RefObject<(HTMLDivElement | null)[]>
}

export const ImprovementExplanationPanel: React.FC<
  ImprovementExplanationPanelProps
> = ({
  improvements,
  hoveredIndex,
  onHoverChange,
  onImprovementClick,
  containerRef,
  cardRefs,
}) => {
    return (
      <div className="space-y-1">
        <h3 className="ml-1 text-sm font-semibold text-foreground">
          {i18n.t("dialogs.promptImprove.explanationTitle")}
        </h3>
        <ScrollArea className="h-[400px] pr-4" viewportRef={containerRef}>
          <div className="p-1 space-y-3">
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
