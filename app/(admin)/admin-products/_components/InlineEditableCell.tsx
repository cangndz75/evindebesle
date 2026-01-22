"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InlineEditableCellProps {
  value: number | string;
  onSave: (value: number | string) => Promise<void>;
  type?: "number" | "text";
  format?: (value: number | string) => string;
  className?: string;
}

export function InlineEditableCell({
  value,
  onSave,
  type = "text",
  format,
  className = "",
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value.toString()) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const finalValue = type === "number" ? parseFloat(editValue) : editValue;
      await onSave(finalValue);
      setIsEditing(false);
      toast.success("Güncellendi");
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Güncelleme başarısız");
      setEditValue(value.toString());
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-8 text-sm"
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setIsEditing(false);
              setEditValue(value.toString());
            }
          }}
          autoFocus
          disabled={saving}
        />
        <Button size="sm" variant="ghost" onClick={handleSave} disabled={saving}>
          ✓
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer hover:bg-gray-50 p-1 rounded ${className}`}
      onClick={() => setIsEditing(true)}
      title="Düzenlemek için tıklayın"
    >
      {format ? format(value) : value.toString()}
    </div>
  );
}
