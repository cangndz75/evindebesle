"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Megaphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CampaignBannerForm from "../_components/CampaignBannerForm";
import type { CampaignBannerAdmin } from "@/lib/campaign-banner";
import { getCampaignStatusLabel } from "@/lib/campaign-banner";
import { Badge } from "@/components/ui/badge";

export default function AdminCampaignBannerEditPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignBannerAdmin | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/admin/campaign-banner/${id}`);
        if (res.ok) {
          setCampaign(await res.json());
        } else {
          toast.error("Kampanya bulunamadı");
        }
      } catch {
        toast.error("Yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Kampanya bulunamadı.</p>
        <Button asChild variant="outline">
          <Link href="/admin-campaign-banner">Listeye dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href="/admin-campaign-banner">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Tüm kampanyalar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-7 h-7" />
            {campaign.name}
          </h1>
          <div className="mt-2">
            <Badge>{getCampaignStatusLabel(campaign.status)}</Badge>
          </div>
        </div>
      </div>

      <CampaignBannerForm campaignId={id} initial={campaign} />
    </div>
  );
}
