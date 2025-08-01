import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ReviewModal({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/appointment-reviews?appointmentId=${appointmentId}`)
      .then((res) => res.json())
      .then((data) => {
        setHasReviewed(!!data.review);
      });
  }, [appointmentId]);

  const handleSubmit = async () => {
    if (!rating) return toast.error("Lütfen bir puan seçin.");
    setSubmitting(true);

    const res = await fetch("/api/appointment-reviews", {
      method: "POST",
      body: JSON.stringify({ appointmentId, rating, comment }),
    });

    if (res.ok) {
      toast.success("Yorum başarıyla kaydedildi.");
      setHasReviewed(true);
    } else {
      const err = await res.json();
      toast.error(err.error || "Hata oluştu.");
    }

    setSubmitting(false);
  };

  if (hasReviewed === null) return null;
  if (hasReviewed) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Yorumla</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hizmet Değerlendirmesi</DialogTitle>
          <DialogDescription>
            Bu randevu hakkında düşüncelerinizi paylaşın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Puan</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant={rating === num ? "default" : "outline"}
                  className="w-10 h-10 rounded-full"
                  onClick={() => setRating(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Yorum</Label>
            <Textarea
              placeholder="Yorumunuzu buraya yazabilirsiniz..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="text-right">
            <Button onClick={handleSubmit} disabled={submitting}>
              Gönder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
