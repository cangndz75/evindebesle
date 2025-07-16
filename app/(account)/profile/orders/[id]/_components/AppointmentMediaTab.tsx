"use client";

import { JSX, useMemo } from "react";
import { ImageIcon, VideoIcon, MicIcon } from "lucide-react";

type MediaItem = {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
};

type Props = {
  media: MediaItem[];
};

export default function AppointmentMediaGallery({ media }: Props) {
  const hasMedia = media?.length > 0;

  const renderMedia = (item: MediaItem) => {
    switch (item.type) {
      case "image":
        return (
          <img
            src={item.url}
            alt="Hizmet Görseli"
            className="w-full h-auto rounded-md object-cover"
          />
        );
      case "video":
        return (
          <video controls className="w-full rounded-md">
            <source src={item.url} type="video/mp4" />
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        );
      case "audio":
        return (
          <audio controls className="w-full mt-2">
            <source src={item.url} type="audio/mpeg" />
            Tarayıcınız ses oynatmayı desteklemiyor.
          </audio>
        );
    }
  };

  const iconMap: Record<MediaItem["type"], JSX.Element> = {
    image: <ImageIcon className="w-4 h-4 mr-1" />,
    video: <VideoIcon className="w-4 h-4 mr-1" />,
    audio: <MicIcon className="w-4 h-4 mr-1" />,
  };

  return (
    <div className="bg-white p-6 rounded-md border">
      <h2 className="text-lg font-semibold mb-4">Yüklenen Medyalar</h2>

      {!hasMedia && (
        <p className="text-muted-foreground text-sm">
          Herhangi bir medya yüklenmemiş.
        </p>
      )}

      {hasMedia && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item) => (
            <div key={item.id} className="border rounded-md p-2 shadow-sm">
              <div className="flex items-center mb-2 text-muted-foreground text-sm">
                {iconMap[item.type]}
                {item.type.toUpperCase()}
              </div>
              {renderMedia(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
