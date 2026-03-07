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
  const [active, setActive] = useState(false)

  useEffect(() => {
    // Ignore MouseEnter that occurs immediately upon display.
    setTimeout(() => setActive(true), 100)
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
            if (!active) return
            onSelectAt(index)
          }}
        />
      ))}
    </div>
  )
}
