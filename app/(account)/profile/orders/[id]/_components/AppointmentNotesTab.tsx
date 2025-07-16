"use client";

type Props = {
  adminNote?: string | null;
};

export default function AppointmentNoteCard({ adminNote }: Props) {
  return (
    <div className="bg-white p-6 rounded-md border">
      <h2 className="text-lg font-semibold mb-2">Hizmete Dair Not</h2>

      {!adminNote ? (
        <p className="text-sm text-muted-foreground">
          Bu randevu için henüz bir not bulunmamaktadır.
        </p>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {adminNote}
        </p>
      )}
    </div>
  );
}
