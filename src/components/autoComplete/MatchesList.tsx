import React, { useState, useEffect } from "react"
import { AutoCompleteItem } from "./AutoCompleteItem"
import type { AutoCompleteMatch } from "@/services/autoComplete/types"

/**
 * Props for MatchesList component
 */
interface MatchesListProps {
  matches: AutoCompleteMatch[]
  selectedIndex: number
  onExecute: (match: AutoCompleteMatch) => void
  onSelectAt: (index: number) => void
}

/**
 * Matches list component - displays autocomplete matches
 */
export const MatchesList: React.FC<MatchesListProps> = ({
  matches,
  selectedIndex,
  onExecute,
  onSelectAt,
}) => {
  // Delay (ms) to ignore spurious MouseEnter fired right after the list appears.
  const MOUSE_ENTER_DELAY_MS = 100

  const [isMouseEnterEnabled, setIsMouseEnterEnabled] = useState(false)

  useEffect(() => {
    // Ignore MouseEnter that occurs immediately upon display.
    const timer = setTimeout(() => setIsMouseEnterEnabled(true), MOUSE_ENTER_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div>
      {matches.map((match, index) => (
        <AutoCompleteItem
          key={`${match.name}-${index}`}
          match={match}
          isSelected={index === selectedIndex}
          onClick={onExecute}
          onMouseEnter={() => {
            if (!isMouseEnterEnabled) return
            onSelectAt(index)
          }}
        />
      ))}
    </div>
  )
}
