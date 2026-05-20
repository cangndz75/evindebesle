"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getCampaignStatusLabel,
  type CampaignBannerAdmin,
  type CampaignBannerStatus,
} from "@/lib/campaign-banner";

function statusVariant(
  status: CampaignBannerStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "live":
      return "default";
    case "scheduled":
      return "secondary";
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
}

function formatDateRange(startsAt: string | null, endsAt: string | null) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  if (startsAt && endsAt) return `${fmt(startsAt)} – ${fmt(endsAt)}`;
  if (startsAt) return `${fmt(startsAt)}'den itibaren`;
  if (endsAt) return `${fmt(endsAt)}'e kadar`;
  return "Süresiz";
}

export default function AdminCampaignBannerListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignBannerAdmin[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/campaign-banner");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns ?? []);
      }
    } catch {
      toast.error("Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setActingId("new");
    try {
      const res = await fetch("/api/admin/campaign-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Yeni Kampanya" }),
      });
      if (res.ok) {
        const created = await res.json();
        router.push(`/admin-campaign-banner/${created.id}`);
      } else {
        toast.error("Kampanya oluşturulamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setActingId(null);
    }
  };

  const handleActivate = async (id: string) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/campaign-banner/${id}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Kampanya yayına alındı");
        await load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Yayına alınamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setActingId(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/campaign-banner/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      if (res.ok) {
        toast.success("Kampanya durduruldu");
        await load();
      } else {
        toast.error("Durdurulamadı");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" kampanyasını silmek istediğinize emin misiniz?`)) {
      return;
    }
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/campaign-banner/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Kampanya silindi");
        await load();
      } else {
        toast.error("Silinemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="admin-page mx-auto max-w-6xl pb-12">
      <div className="admin-page-header">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
            <Megaphone className="w-7 h-7" />
            Kampanya Bannerları
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Birden fazla kampanya oluşturun; yalnızca biri yayında olur. Tarih
            aralığı ve kademeler sepete otomatik yansır.
          </p>
        </div>
        <div className="admin-page-actions">
        <Button onClick={handleCreate} disabled={actingId === "new"} className="w-full sm:w-auto">
          {actingId === "new" ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Yeni Kampanya
        </Button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">Henüz kampanya yok.</p>
          <Button onClick={handleCreate}>İlk kampanyayı oluştur</Button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Başlık</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {c.title.replace(/\n/g, " ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)}>
                      {getCampaignStatusLabel(c.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateRange(c.startsAt, c.endsAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin-campaign-banner/${c.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </Button>
                      {c.status !== "live" && c.status !== "expired" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Yayına al"
                          disabled={actingId === c.id}
                          onClick={() => handleActivate(c.id)}
                        >
                          <Play className="w-4 h-4 text-green-700" />
                        </Button>
                      ) : c.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Durdur"
                          disabled={actingId === c.id}
                          onClick={() => handleDeactivate(c.id)}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        disabled={actingId === c.id}
                        onClick={() => handleDelete(c.id, c.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
