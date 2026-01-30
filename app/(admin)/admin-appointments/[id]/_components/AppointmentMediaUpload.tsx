"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, VideoIcon, MicIcon } from "lucide-react";
import { uploadFileToCloudinary } from "@/lib/cloudinary";

type UploadedMedia = {
  url: string;
  type: "PHOTO" | "VIDEO" | "AUDIO";
};

export default function AppointmentMediaUpload({
  onUploaded,
}: {
  onUploaded: (media: UploadedMedia) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState<UploadedMedia["type"]>("PHOTO");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const secure_url = await uploadFileToCloudinary(file);
      if (secure_url) {
        onUploaded({ url: secure_url, type: fileType });
      }
    } catch (err) {
      console.error("Yükleme hatası:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant={fileType === "PHOTO" ? "default" : "outline"}
          onClick={() => setFileType("PHOTO")}
          size="sm"
        >
          <ImageIcon className="w-4 h-4 mr-1" /> Foto
        </Button>
        <Button
          variant={fileType === "VIDEO" ? "default" : "outline"}
          onClick={() => setFileType("VIDEO")}
          size="sm"
        >
          <VideoIcon className="w-4 h-4 mr-1" /> Video
        </Button>
        <Button
          variant={fileType === "AUDIO" ? "default" : "outline"}
          onClick={() => setFileType("AUDIO")}
          size="sm"
        >
          <MicIcon className="w-4 h-4 mr-1" /> Ses
        </Button>
      </div>

      <Input
        type="file"
        accept={
          fileType === "PHOTO"
            ? "image/*"
            : fileType === "VIDEO"
              ? "video/*"
              : "audio/*"
        }
        onChange={handleUpload}
        disabled={uploading}
      />

      {uploading && (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      )}
    </div>
  );
}
