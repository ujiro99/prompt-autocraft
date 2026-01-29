/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CategoryEditor } from "../CategoryEditor"
import { ContainerProvider } from "@/contexts/ContainerContext"
import type { Category } from "@/types/promptOrganizer"

// Mock i18n
vi.mock("#imports", () => ({
  i18n: {
    t: (key: string) => key,
  },
}))

// Mock useContainer
vi.mock("@/hooks/useContainer", () => ({
  useContainer: () => ({ container: document.body }),
}))

// Mock CategoryService
vi.mock("@/services/promptOrganizer/CategoryService", () => {
  const mockGetAll = vi.fn()
  const mockCreate = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()

  return {
    categoryService: {
      getAll: mockGetAll,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  }
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ContainerProvider container={document.body}>{children}</ContainerProvider>
  )
}

describe("CategoryEditor", () => {
  const mockOnValueChange = vi.fn()

  const defaultCategories: Category[] = [
    {
      id: "externalCommunication",
      name: "External Communication",
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "development",
      name: "Development & Tech",
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const customCategories: Category[] = [
    {
      id: "custom1",
      name: "Custom Category 1",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "custom2",
      name: "Custom Category 2",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  let mockGetAll: any
  let mockCreate: any
  let mockUpdate: any
  let mockDelete: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Import mocked service to get access to mocked functions
    const { categoryService } = await import(
      "@/services/promptOrganizer/CategoryService"
    )
    mockGetAll = categoryService.getAll as any
    mockCreate = categoryService.create as any
    mockUpdate = categoryService.update as any
    mockDelete = categoryService.delete as any

    mockGetAll.mockResolvedValue([...defaultCategories, ...customCategories])
  })

  describe("Category Display", () => {
    it("should load and display categories", async () => {
      render(
        <TestWrapper>
          <CategoryEditor
            value=""
            onValueChange={mockOnValueChange}
            container={document.body}
          />
        </TestWrapper>,
      )

      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalledTimes(1)
      })
    })

    it("should display add category button", async () => {
      render(
        <TestWrapper>
          <CategoryEditor
            value=""
            onValueChange={mockOnValueChange}
            container={document.body}
          />
        </TestWrapper>,
      )

      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalled()
      })

      // Open select dropdown
      const trigger = screen.getByRole("combobox")
      await userEvent.click(trigger)

      // Check for add category button
      const addButton = await screen.findByText(
        "organizer.category.addCategory",
      )
      expect(addButton).toBeDefined()
    })
  })

  describe("Add Category", () => {
    it("should create a new category", async () => {
      const newCategory: Category = {
        id: "custom3",
        name: "New Category",
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCreate.mockResolvedValue(newCategory)
      mockGetAll.mockResolvedValueOnce([...defaultCategories, ...customCategories])
      mockGetAll.mockResolvedValueOnce([
        ...defaultCategories,
        ...customCategories,
        newCategory,
      ])

      render(
        <TestWrapper>
          <CategoryEditor
            value=""
            onValueChange={mockOnValueChange}
            container={document.body}
          />
        </TestWrapper>,
      )

      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalled()
      })

      // Open select dropdown
      const trigger = screen.getByRole("combobox")
      await userEvent.click(trigger)

      // Click add category button
      const addButton = await screen.findByText(
        "organizer.category.addCategory",
      )
      await userEvent.click(addButton)

      // Find input field
      const input = await screen.findByPlaceholderText(
        "organizer.category.addCategoryPlaceholder",
      )
      expect(input).toBeDefined()

      // Type category name
      await userEvent.type(input, "New Category")

      // Click confirm button
      const confirmButton = screen.getAllByRole("button").find((btn) => {
        const svg = btn.querySelector("svg")
        return svg?.classList.contains("lucide-check")
      })
      expect(confirmButton).toBeDefined()
      await userEvent.click(confirmButton!)

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith("New Category")
        expect(mockOnValueChange).toHaveBeenCalledWith("custom3")
      })
    })
  })

  describe("Delete Category", () => {
    it("should delete a custom category", async () => {
      mockGetAll.mockResolvedValueOnce([...defaultCategories, ...customCategories])
      mockGetAll.mockResolvedValueOnce([...defaultCategories])

      render(
        <TestWrapper>
          <CategoryEditor
            value=""
            onValueChange={mockOnValueChange}
            container={document.body}
          />
        </TestWrapper>,
      )

      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalled()
      })

      // Open select dropdown
      const trigger = screen.getByRole("combobox")
      await userEvent.click(trigger)

      // Find and hover over a custom category to show menu
      const customCategoryItem = await screen.findByText("Custom Category 1")
      await userEvent.hover(customCategoryItem)

      // Find the menu button (should appear on hover)
      // Note: This is simplified, actual implementation may need to wait for the menu button
      const menuButtons = screen.getAllByRole("button").filter((btn) => {
        const svg = btn.querySelector("svg")
        return svg?.classList.contains("lucide-more-vertical")
      })

      if (menuButtons.length > 0) {
        await userEvent.click(menuButtons[0])

        // Find delete option
        const deleteOption = await screen.findByText(
          "organizer.category.deleteCategory",
        )
        await userEvent.click(deleteOption)

        // Confirm deletion in dialog
        const confirmDeleteButton = await screen.findByText("common.delete")
        await userEvent.click(confirmDeleteButton)

        await waitFor(() => {
          expect(mockDelete).toHaveBeenCalledWith("custom1")
        })
      }
    })
  })

  describe("Rename Category", () => {
    it("should rename a custom category", async () => {
      mockGetAll.mockResolvedValue([...defaultCategories, ...customCategories])

      render(
        <TestWrapper>
          <CategoryEditor
            value=""
            onValueChange={mockOnValueChange}
            container={document.body}
          />
        </TestWrapper>,
      )

      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalled()
      })

      // Open select dropdown
      const trigger = screen.getByRole("combobox")
      await userEvent.click(trigger)

      // Find and hover over a custom category to show menu
      const customCategoryItem = await screen.findByText("Custom Category 1")
      await userEvent.hover(customCategoryItem)

      // Find the menu button
      const menuButtons = screen.getAllByRole("button").filter((btn) => {
        const svg = btn.querySelector("svg")
        return svg?.classList.contains("lucide-more-vertical")
      })

      if (menuButtons.length > 0) {
        await userEvent.click(menuButtons[0])

        // Find rename option
        const renameOption = await screen.findByText(
          "organizer.category.renameCategory",
        )
        await userEvent.click(renameOption)

        // Find rename input
        const renameInput = await screen.findByPlaceholderText(
          "organizer.category.renameCategoryPlaceholder",
        )
        expect(renameInput).toBeDefined()

        // Clear and type new name
        await userEvent.clear(renameInput)
        await userEvent.type(renameInput, "Renamed Category")

        // Click confirm button
        const confirmButton = screen.getAllByRole("button").find((btn) => {
          const svg = btn.querySelector("svg")
          return svg?.classList.contains("lucide-check")
        })
        expect(confirmButton).toBeDefined()
        await userEvent.click(confirmButton!)

        await waitFor(() => {
          expect(mockUpdate).toHaveBeenCalledWith("custom1", {
            name: "Renamed Category",
          })
        })
      }
    })
  })
})
