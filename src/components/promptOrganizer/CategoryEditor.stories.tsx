import type { Meta, StoryObj } from "@storybook/react-vite"
import { CategoryEditor } from "./CategoryEditor"
import { ContainerProvider } from "@/contexts/ContainerContext"
import { fn } from "@storybook/test"

const meta = {
  title: "Components/PromptOrganizer/CategoryEditor",
  component: CategoryEditor,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <ContainerProvider container={document.body}>
        <div style={{ width: "300px" }}>
          <Story />
        </div>
      </ContainerProvider>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof CategoryEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: "",
    onValueChange: fn(),
    container: document.body,
  },
}

export const WithSelectedCategory: Story = {
  args: {
    value: "externalCommunication",
    onValueChange: fn(),
    container: document.body,
  },
}
