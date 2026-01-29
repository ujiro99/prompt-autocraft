/**
 * Category Editor Component
 * Provides UI for adding, renaming, and deleting categories
 */

import { useState, useCallback, useRef, useEffect } from "react"
import { i18n } from "#imports"
import { Plus, MoreVertical, Pencil, Trash2, Check, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Category } from "@/types/promptOrganizer"
import { categoryService } from "@/services/promptOrganizer/CategoryService"
import { cn } from "@/lib/utils"

interface CategoryEditorProps {
  value: string
  onValueChange: (categoryId: string) => void
  className?: string
  container?: HTMLElement | null
}

export const CategoryEditor = ({
  value,
  onValueChange,
  className,
  container,
}: CategoryEditorProps) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(
    null,
  )
  const [renameCategoryName, setRenameCategoryName] = useState("")
  const addInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Load categories
  const loadCategories = useCallback(async () => {
    const cats = await categoryService.getAll()
    setCategories(cats)
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Get category name (with i18n for default categories)
  const getCategoryName = (category: Category): string => {
    if (category.isDefault) {
      const i18nKey = `organizer.category.${category.id}`
      return i18n.t(i18nKey)
    }
    return category.name
  }

  // Separate default and custom categories
  const defaultCategories = categories.filter((c) => c.isDefault)
  const customCategories = categories.filter((c) => !c.isDefault)

  // Add category
  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      return
    }

    try {
      const newCategory = await categoryService.create(newCategoryName.trim())
      await loadCategories()
      onValueChange(newCategory.id)
      setNewCategoryName("")
      setIsAddingCategory(false)
    } catch (error) {
      console.error("Failed to create category:", error)
    }
  }, [newCategoryName, loadCategories, onValueChange])

  // Start renaming
  const handleStartRename = useCallback(
    (category: Category) => {
      setRenamingCategoryId(category.id)
      setRenameCategoryName(category.name)
      // Focus input after state update
      setTimeout(() => {
        renameInputRef.current?.focus()
        renameInputRef.current?.select()
      }, 0)
    },
    [],
  )

  // Rename category
  const handleRenameCategory = useCallback(
    async (categoryId: string) => {
      if (!renameCategoryName.trim()) {
        setRenamingCategoryId(null)
        return
      }

      try {
        await categoryService.update(categoryId, {
          name: renameCategoryName.trim(),
        })
        await loadCategories()
        setRenamingCategoryId(null)
        setRenameCategoryName("")
      } catch (error) {
        console.error("Failed to rename category:", error)
      }
    },
    [renameCategoryName, loadCategories],
  )

  // Cancel rename
  const handleCancelRename = useCallback(() => {
    setRenamingCategoryId(null)
    setRenameCategoryName("")
  }, [])

  // Start delete
  const handleStartDelete = useCallback((category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }, [])

  // Delete category
  const handleDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return

    try {
      await categoryService.delete(categoryToDelete.id)
      await loadCategories()
      // If deleted category was selected, clear selection
      if (value === categoryToDelete.id) {
        onValueChange("")
      }
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      console.error("Failed to delete category:", error)
    }
  }, [categoryToDelete, loadCategories, value, onValueChange])

  // Focus add input when adding starts
  useEffect(() => {
    if (isAddingCategory) {
      addInputRef.current?.focus()
    }
  }, [isAddingCategory])

  return (
    <>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue
            placeholder={i18n.t("organizer.category.selectCategory")}
          />
        </SelectTrigger>
        <SelectContent container={container}>
          {/* Default categories */}
          {defaultCategories.length > 0 && (
            <>
              {defaultCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {getCategoryName(category)}
                </SelectItem>
              ))}
            </>
          )}

          {/* Custom categories */}
          {customCategories.length > 0 && (
            <>
              {defaultCategories.length > 0 && (
                <div className="my-1 h-px bg-border" />
              )}
              {customCategories.map((category) => (
                <div
                  key={category.id}
                  className="relative flex items-center gap-1 group"
                >
                  {renamingCategoryId === category.id ? (
                    <div className="flex items-center gap-1 w-full px-2 py-1.5">
                      <Input
                        ref={renameInputRef}
                        value={renameCategoryName}
                        onChange={(e) => setRenameCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameCategory(category.id)
                          } else if (e.key === "Escape") {
                            handleCancelRename()
                          }
                        }}
                        className="h-6 text-sm"
                        placeholder={i18n.t(
                          "organizer.category.renameCategoryPlaceholder",
                        )}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleRenameCategory(category.id)}
                        aria-label={i18n.t("common.save")}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={handleCancelRename}
                        aria-label={i18n.t("common.cancel")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <SelectItem
                        value={category.id}
                        className="flex-1 pr-8"
                      >
                        {category.name}
                      </SelectItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "absolute right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                            )}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            aria-label={i18n.t("common.edit")}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          container={container}
                          align="end"
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartRename(category)
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-2" />
                            {i18n.t("organizer.category.renameCategory")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartDelete(category)
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            {i18n.t("organizer.category.deleteCategory")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Add category section */}
          <div className="my-1 h-px bg-border" />
          {isAddingCategory ? (
            <div className="flex items-center gap-1 px-2 py-1.5">
              <Input
                ref={addInputRef}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCategory()
                  } else if (e.key === "Escape") {
                    setIsAddingCategory(false)
                    setNewCategoryName("")
                  }
                }}
                className="h-6 text-sm"
                placeholder={i18n.t(
                  "organizer.category.addCategoryPlaceholder",
                )}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleAddCategory}
                aria-label={i18n.t("common.save")}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setIsAddingCategory(false)
                  setNewCategoryName("")
                }}
                aria-label={i18n.t("common.cancel")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsAddingCategory(true)
              }}
              aria-label={i18n.t("organizer.category.addCategory")}
            >
              <Plus className="h-3 w-3" />
              {i18n.t("organizer.category.addCategory")}
            </button>
          )}
        </SelectContent>
      </Select>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent container={container}>
          <DialogHeader>
            <DialogTitle>
              {i18n.t("organizer.category.confirmDeleteTitle")}
            </DialogTitle>
            <DialogDescription>
              {i18n.t("organizer.category.confirmDeleteMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {i18n.t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              {i18n.t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
