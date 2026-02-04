import { MessageCircleMore } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ImproveLog } from "@/services/promptImprover/improverService"
import { ImprovementExplanationCard } from "./ImprovementExplanationCard"
import { ScrollArea } from "@/components/ui/scroll-area"
import { i18n } from "#imports"

export const ImprovementExplanationTitle: React.FC = () => {
  return (
    <h3 className="text-sm font-semibold text-foreground">
      <MessageCircleMore className="size-4 inline-block mr-1 -mt-1 stroke-fuchsia-400 fill-purple-100" />
      {i18n.t("variablePresets.aiGeneration.dialog.explanation")}
    </h3>
  )
}

interface ImprovementExplanationPanelProps {
  improvements: ImproveLog[]
  hoveredIndex: number | null
  onHoverChange: (index: number | null) => void
  onImprovementClick: (startLine: number, endLine: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  cardRefs: React.RefObject<(HTMLDivElement | null)[]>
  className?: string
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
  className,
}) => {
  return (
    <ScrollArea
      className={cn("pr-4 h-full overflow-hidden", className)}
      viewportRef={containerRef}
    >
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
  )
}
