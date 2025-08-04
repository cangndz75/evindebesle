"use client";

import { useState } from "react";
import {
  ImageIcon,
  VideoIcon,
  MicIcon,
  RotateCw,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type MediaItem = {
  id: string;
  type: "image" | "photo" | "video" | "audio" | string;
  url: string;
};

type Props = {
  media: MediaItem[];
};

export default function AppointmentMediaGallery({ media }: Props) {
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [rotateDeg, setRotateDeg] = useState(0);

  const openModal = (item: MediaItem) => {
    setSelected(item);
    setRotateDeg(0);
  };

  const iconMap = {
    image: <ImageIcon className="w-4 h-4 mr-1" />,
    photo: <ImageIcon className="w-4 h-4 mr-1" />,
    video: <VideoIcon className="w-4 h-4 mr-1" />,
    audio: <MicIcon className="w-4 h-4 mr-1" />,
  };

  const normalizeType = (type: string) => type.toLowerCase();

  return (
    <>
      <div className="bg-white p-6 rounded-md border">
        <h2 className="text-lg font-semibold mb-4">Yüklenen Medyalar</h2>

        {media.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Herhangi bir medya yüklenmemiş.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item) => {
              const type = normalizeType(item.type);
              return (
                <div
                  key={item.id}
                  className="border rounded-md p-2 shadow-sm cursor-pointer"
                  onClick={() => type !== "audio" && openModal(item)}
                >
                  <div className="flex items-center mb-2 text-muted-foreground text-sm">
                    {iconMap[type as keyof typeof iconMap]}
                    {type.toUpperCase()}
                  </div>

                  {["image", "photo"].includes(type) && (
                    <img
                      src={item.url}
                      alt="Yüklenen görsel"
                      className="w-full h-40 object-cover rounded"
                    />
                  )}

                  {type === "video" && (
                    <video className="w-full h-40 object-cover rounded" muted>
                      <source src={item.url} type="video/mp4" />
                    </video>
                  )}

                  {type === "audio" && (
                    <div className="mt-2">
                      <audio controls className="w-full">
                        <source src={item.url} type="audio/mpeg" />
                      </audio>
                      <Button variant="outline" className="mt-2 w-full" asChild>
                        <a href={item.url} download>
                          <Download className="w-4 h-4 mr-2" /> Sesi İndir
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {selected?.type.toUpperCase()}
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-end gap-2 mb-2">
            {selected &&
              ["image", "photo"].includes(normalizeType(selected.type)) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRotateDeg((prev) => prev + 90)}
                >
                  <RotateCw className="w-4 h-4 mr-1" /> Döndür
                </Button>
              )}
            {selected && (
              <Button size="sm" variant="outline" asChild>
                <a href={selected.url} download>
                  <Download className="w-4 h-4 mr-1" /> İndir
                </a>
              </Button>
            )}
          </div>

          {selected &&
            ["image", "photo"].includes(normalizeType(selected.type)) && (
              <img
                src={selected.url}
                alt="Görsel"
                className="max-h-[60vh] mx-auto rounded"
                style={{ transform: `rotate(${rotateDeg}deg)` }}
              />
            )}

          {selected && normalizeType(selected.type) === "video" && (
            <video controls className="max-h-[60vh] mx-auto rounded">
              <source src={selected.url} type="video/mp4" />
            </video>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
