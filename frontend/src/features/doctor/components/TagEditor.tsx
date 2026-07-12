import { useState } from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TagEditorProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  variant?: string
  emptyText?: string
}

export function TagEditor({
  items,
  onChange,
  placeholder = "Type and press Enter…",
  variant = "info",
  emptyText,
}: TagEditorProps) {
  const [draft, setDraft] = useState("")

  const addTag = () => {
    const value = draft.trim()
    if (!value) return
    if (items.some(i => i.toLowerCase() === value.toLowerCase())) {
      setDraft("")
      return
    }
    onChange([...items, value])
    setDraft("")
  }

  const removeTag = (idx: number) => onChange(items.filter((_, i) => i !== idx))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    } else if (e.key === "Backspace" && !draft && items.length > 0) {
      removeTag(items.length - 1)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[28px]">
        {items.length === 0 && emptyText && (
          <p className="text-xs text-muted-foreground italic py-1">{emptyText}</p>
        )}
        {items.map((item, i) => (
          <Badge key={`${item}-${i}`} variant={variant as any} className="text-sm px-3 py-1 gap-1.5 pr-1.5">
            {item}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-9 text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={addTag} className="shrink-0 h-9">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
