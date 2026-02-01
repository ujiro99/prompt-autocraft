import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { useState } from "react"
import { PromptInputSection } from "./PromptInputSection"

const meta = {
  title: "PromptImprover/PromptInputSection",
  component: PromptInputSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PromptInputSection>

export default meta
type Story = StoryObj<typeof meta>

// Empty state
export const Empty: Story = {
  args: {
    content: "",
    onChange: fn(),
    label: "Prompt Content",
    placeholder: "Enter your prompt here...",
    disabled: false,
  },
}

// With content
export const WithContent: Story = {
  args: {
    content: "Write a function that calculates the factorial of a number",
    onChange: fn(),
    label: "Prompt Content",
    placeholder: "Enter your prompt here...",
    disabled: false,
  },
}

// Disabled
export const Disabled: Story = {
  args: {
    content: "This input is disabled",
    onChange: fn(),
    label: "Prompt Content",
    placeholder: "Enter your prompt here...",
    disabled: true,
  },
}

// Interactive example with state management
const InteractiveExample = () => {
  const [content, setContent] = useState(
    "Write a function that calculates the factorial of a number",
  )

  return (
    <div className="w-[500px]">
      <PromptInputSection
        content={content}
        onChange={setContent}
        label="Prompt Content"
        placeholder="Enter your prompt here..."
        disabled={false}
      />
      <div className="mt-4 text-sm text-muted-foreground">
        Character count: {content.length}
      </div>
    </div>
  )
}

export const Interactive: Story = {
  args: {
    content: "",
    onChange: fn(),
    label: "Prompt Content",
  },
  render: () => <InteractiveExample />,
}
