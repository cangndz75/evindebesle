"use client";

import { useState } from "react";
import { Monitor, Smartphone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InboxPreviewCard from "./InboxPreviewCard";
import RenderedEmail from "./RenderedEmail";
import { CampaignDraft } from "../types";

interface PreviewPaneProps {
  draft: CampaignDraft;
  previewUser: string;
  deviceView: "desktop" | "mobile";
  onPreviewUserChange: (user: string) => void;
  onDeviceViewChange: (view: "desktop" | "mobile") => void;
}

const previewUsers: Array<{ id: string; name: string; variables: Record<string, string> }> = [
  { id: "default", name: "Varsayılan", variables: {} },
  {
    id: "can",
    name: "Can",
    variables: {
      first_name: "Can",
      last_name: "Yılmaz",
      email: "can@example.com",
      coupon_code: "CAN25",
    },
  },
  {
    id: "ayse",
    name: "Ayşe",
    variables: {
      first_name: "Ayşe",
      last_name: "Demir",
      email: "ayse@example.com",
      coupon_code: "AYSE25",
    },
  },
  {
    id: "guest",
    name: "Misafir",
    variables: {
      first_name: "",
      last_name: "",
      email: "guest@example.com",
      coupon_code: "",
    },
  },
];

export default function PreviewPane({
  draft,
  previewUser,
  deviceView,
  onPreviewUserChange,
  onDeviceViewChange,
}: PreviewPaneProps) {
  const selectedUser: { id: string; name: string; variables: Record<string, string> } = 
    previewUsers.find((u) => u.id === previewUser) || previewUsers[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Önizleme</h3>
          <div className="flex gap-1">
            <Button
              variant={deviceView === "desktop" ? "default" : "ghost"}
              size="sm"
              onClick={() => onDeviceViewChange("desktop")}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceView === "mobile" ? "default" : "ghost"}
              size="sm"
              onClick={() => onDeviceViewChange("mobile")}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Kişiselleştirme Örneği
          </label>
          <Select value={previewUser} onValueChange={onPreviewUserChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {previewUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inbox Preview */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <InboxPreviewCard
          subject={draft.subject}
          preheader={draft.preheader}
          fromName={draft.fromName}
          fromEmail={draft.fromEmail}
        />
      </div>

      {/* Rendered Email */}
      <div className="flex-1 overflow-y-auto p-4">
        <RenderedEmail
          draft={draft}
          previewUser={selectedUser}
          deviceView={deviceView}
        />
      </div>
    </div>
  );
}
