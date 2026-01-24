"use client";

interface InboxPreviewCardProps {
  subject: string;
  preheader: string;
  fromName: string;
  fromEmail: string;
}

export default function InboxPreviewCard({
  subject,
  preheader,
  fromName,
  fromEmail,
}: InboxPreviewCardProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-gray-600">
            {fromName.charAt(0).toUpperCase() || "E"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {fromName || "Gönderen"}
            </div>
            <div className="text-xs text-gray-500 ml-2">Şimdi</div>
          </div>
          <div className="text-xs text-gray-500 mb-1 truncate">
            {fromEmail || "email@example.com"}
          </div>
          <div className="font-medium text-sm text-gray-900 mb-1 truncate">
            {subject || "Subject ekleyin"}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {preheader || "Preheader ekleyin"}
          </div>
        </div>
      </div>
    </div>
  );
}
