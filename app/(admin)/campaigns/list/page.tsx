"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    Plus,
    BarChart3,
    Edit,
    Copy,
    Trash2,
    Mail,
    Calendar,
    MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Campaign {
    id: string;
    name: string;
    status: "draft" | "ready" | "scheduled" | "sent";
    subject: string;
    sentCount: number;
    sentAt: string | null;
    scheduleAt: string | null;
    createdAt: string;
}

const statusConfig: Record<
    Campaign["status"],
    { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
    draft: { label: "Taslak", variant: "secondary" },
    ready: { label: "HazÄ±r", variant: "outline" },
    scheduled: { label: "ZamanlandÄ±", variant: "default" },
    sent: { label: "GÃ¶nderildi", variant: "default" },
};

export default function CampaignListPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (sessionStatus === "loading") return;

        if (!session) {
            router.push("/login");
            return;
        }

        fetchCampaigns();
    }, [session, sessionStatus, router]);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch("/api/admin/campaigns");
            if (response.ok) {
                const data = await response.json();
                setCampaigns(data.campaigns || []);
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            toast.error("Kampanyalar yÃ¼klenemedi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDuplicate = async (campaign: Campaign) => {
        try {
            const response = await fetch("/api/admin/campaigns");
            const data = await response.json();
            const fullCampaign = data.campaigns.find(
                (c: Campaign) => c.id === campaign.id
            );

            if (!fullCampaign) {
                toast.error("Kampanya bulunamadÄ±");
                return;
            }

            const duplicateResponse = await fetch("/api/admin/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...fullCampaign,
                    id: undefined,
                    name: `${fullCampaign.name} (Kopya)`,
                    status: "draft",
                    sentAt: null,
                    sentCount: 0,
                }),
            });

            if (duplicateResponse.ok) {
                toast.success("Kampanya kopyalandÄ±");
                fetchCampaigns();
            }
        } catch (error) {
            console.error("Error duplicating campaign:", error);
            toast.error("Kopyalama baÅŸarÄ±sÄ±z");
        }
    };

    const handleDelete = async (campaignId: string) => {
        setCampaignToDelete(campaignId);
        setConfirmDeleteOpen(true);
    };

    const performDelete = async () => {
        if (!campaignToDelete) return;

        try {
            const response = await fetch(`/api/admin/campaigns?id=${campaignToDelete}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Kampanya silindi");
                setCampaigns(campaigns.filter((c) => c.id !== campaignToDelete));
            }
        } catch (error) {
            console.error("Error deleting campaign:", error);
            toast.error("Silme baÅŸarÄ±sÄ±z");
        }
    };

    const filteredCampaigns = campaigns.filter((campaign) => {
        if (activeTab === "all") return true;
        return campaign.status === activeTab;
    });

    if (sessionStatus === "loading" || isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Kampanyalar</h1>
                    <p className="text-gray-500">Email kampanyalarÄ±nÄ±zÄ± yÃ¶netin</p>
                </div>
                <Link href="/campaigns">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Kampanya
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Toplam
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Taslak
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {campaigns.filter((c) => c.status === "draft").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            ZamanlandÄ±
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {campaigns.filter((c) => c.status === "scheduled").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            GÃ¶nderildi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {campaigns.filter((c) => c.status === "sent").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Campaigns Table */}
            <Card>
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="all">TÃ¼mÃ¼</TabsTrigger>
                            <TabsTrigger value="draft">Taslak</TabsTrigger>
                            <TabsTrigger value="scheduled">ZamanlandÄ±</TabsTrigger>
                            <TabsTrigger value="sent">GÃ¶nderildi</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    {filteredCampaigns.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {activeTab === "all"
                                ? "HenÃ¼z kampanya yok. Ä°lk kampanyanÄ±zÄ± oluÅŸturun!"
                                : "Bu kategoride kampanya bulunamadÄ±."}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kampanya</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>GÃ¶nderim</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead className="text-right">Ä°ÅŸlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCampaigns.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{campaign.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {campaign.subject}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusConfig[campaign.status].variant}>
                                                {statusConfig[campaign.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {campaign.status === "sent" ? (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    {campaign.sentCount} kiÅŸi
                                                </span>
                                            ) : campaign.status === "scheduled" && campaign.scheduleAt ? (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {format(new Date(campaign.scheduleAt), "d MMM HH:mm", {
                                                        locale: tr,
                                                    })}
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-500">
                                                {campaign.sentAt
                                                    ? format(new Date(campaign.sentAt), "d MMM yyyy", {
                                                        locale: tr,
                                                    })
                                                    : format(new Date(campaign.createdAt), "d MMM yyyy", {
                                                        locale: tr,
                                                    })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {campaign.status === "sent" && (
                                                        <DropdownMenuItem asChild>
                                                            <Link
                                                                href={`/campaigns/analytics?id=${campaign.id}`}
                                                            >
                                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                                Analytics
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/campaigns?id=${campaign.id}`}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            DÃ¼zenle
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDuplicate(campaign)}
                                                    >
                                                        <Copy className="w-4 h-4 mr-2" />
                                                        Kopyala
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(campaign.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                onConfirm={performDelete}
                title="KampanyayÄ± Sil"
                description="Bu kampanyayÄ± silmek istediÄŸinizden emin misiniz? Bu iÅŸlem geri alÄ±namaz."
            />
        </div>
    );
}
