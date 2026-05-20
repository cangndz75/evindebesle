"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Mail,
    Eye,
    MousePointerClick,
    AlertCircle,
    Users,
    TrendingUp,
    ExternalLink,
    ArrowLeft,
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
import Link from "next/link";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface CampaignAnalytics {
    campaign: {
        id: string;
        name: string;
        subject: string;
        status: string;
        sentAt: string | null;
        createdAt: string;
    };
    stats: {
        totalSent: number;
        totalOpened: number;
        totalClicked: number;
        totalFailed: number;
        totalBounced: number;
        openRate: number;
        clickRate: number;
        clickToSendRate: number;
    };
    timeline: Array<{
        time: string;
        opens: number;
        clicks: number;
    }>;
    recipients: Array<{
        id: string;
        email: string;
        status: string;
        sentAt: string | null;
        openedAt: string | null;
        clickedAt: string | null;
    }>;
    links: Array<{
        id: string;
        url: string;
        clicks: number;
    }>;
}

function AnalyticsContent() {
    const searchParams = useSearchParams();
    const campaignId = searchParams.get("id");
    const [data, setData] = useState<CampaignAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (campaignId) {
            fetchAnalytics(campaignId);
        } else {
            setError("Kampanya ID'si gerekli");
            setIsLoading(false);
        }
    }, [campaignId]);

    const fetchAnalytics = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/campaigns/analytics?id=${id}`);
            if (!response.ok) {
                throw new Error("Analytics verisi alınamadı");
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bir hata oluştu");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-gray-600">{error || "Veri bulunamadı"}</p>
                <Link href="/campaigns">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kampanyalara Dön
                    </Button>
                </Link>
            </div>
        );
    }

    const { campaign, stats, timeline, recipients, links } = data;

    return (
        <div className="admin-page mx-auto max-w-7xl space-y-6">
            
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/campaigns">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">{campaign.name}</h1>
                        <Badge
                            variant={campaign.status === "sent" ? "default" : "secondary"}
                        >
                            {campaign.status === "sent" ? "Gönderildi" : campaign.status}
                        </Badge>
                    </div>
                    <p className="text-gray-500 ml-12">
                        Subject: {campaign.subject}
                        {campaign.sentAt && (
                            <span className="ml-4">
                                • Gönderim:{" "}
                                {format(new Date(campaign.sentAt), "d MMMM yyyy HH:mm", {
                                    locale: tr,
                                })}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gönderildi</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSent}</div>
                        {stats.totalFailed > 0 && (
                            <p className="text-xs text-red-500">
                                {stats.totalFailed} başarısız
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Açıldı</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOpened}</div>
                        <p className="text-xs text-muted-foreground">
                            Açılma oranı: %{stats.openRate}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tıklandı</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClicked}</div>
                        <p className="text-xs text-muted-foreground">
                            Tıklama oranı: %{stats.clickRate}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Etkileşim Oranı
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">%{stats.clickToSendRate}</div>
                        <p className="text-xs text-muted-foreground">
                            Gönderilenlere göre tıklama
                        </p>
                    </CardContent>
                </Card>
            </div>

            
            <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
                    <TabsTrigger value="links">Link Tıklamaları</TabsTrigger>
                    <TabsTrigger value="recipients">Alıcılar</TabsTrigger>
                </TabsList>

                
                <TabsContent value="timeline">
                    <Card>
                        <CardHeader>
                            <CardTitle>Etkileşim Zaman Çizelgesi</CardTitle>
                            <CardDescription>
                                Saatlik açılma ve tıklama verileri
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {timeline.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={timeline}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="time"
                                            tickFormatter={(value) =>
                                                format(new Date(value), "HH:mm", { locale: tr })
                                            }
                                        />
                                        <YAxis />
                                        <Tooltip
                                            labelFormatter={(value) =>
                                                format(new Date(value), "d MMM HH:mm", { locale: tr })
                                            }
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="opens"
                                            stroke="#3b82f6"
                                            name="Açılma"
                                            strokeWidth={2}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="clicks"
                                            stroke="#10b981"
                                            name="Tıklama"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-gray-500">
                                    Henüz etkileşim verisi yok
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                
                <TabsContent value="links">
                    <Card>
                        <CardHeader>
                            <CardTitle>Link Performansı</CardTitle>
                            <CardDescription>Tıklanan linkler ve sayıları</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {links.length > 0 ? (
                                <div className="space-y-4">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={links.slice(0, 10)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="url"
                                                tickFormatter={(value) => {
                                                    try {
                                                        return new URL(value).pathname.slice(0, 20);
                                                    } catch {
                                                        return value.slice(0, 20);
                                                    }
                                                }}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="clicks" fill="#3b82f6" name="Tıklama" />
                                        </BarChart>
                                    </ResponsiveContainer>

                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Link</TableHead>
                                                <TableHead className="text-right">Tıklama</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {links.map((link) => (
                                                <TableRow key={link.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        <a
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 hover:text-blue-600"
                                                        >
                                                            {link.url.length > 60
                                                                ? link.url.slice(0, 60) + "..."
                                                                : link.url}
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {link.clicks}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-gray-500">
                                    Henüz tıklama verisi yok
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                
                <TabsContent value="recipients">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Alıcı Listesi
                            </CardTitle>
                            <CardDescription>
                                Toplam {recipients.length} alıcı
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Gönderildi</TableHead>
                                        <TableHead>Açıldı</TableHead>
                                        <TableHead>Tıklandı</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recipients.slice(0, 50).map((recipient) => (
                                        <TableRow key={recipient.id}>
                                            <TableCell className="font-mono text-sm">
                                                {recipient.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        recipient.status === "sent"
                                                            ? "default"
                                                            : recipient.status === "failed"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                >
                                                    {recipient.status === "sent"
                                                        ? "Gönderildi"
                                                        : recipient.status === "failed"
                                                            ? "Başarısız"
                                                            : recipient.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {recipient.sentAt
                                                    ? format(new Date(recipient.sentAt), "d MMM HH:mm", {
                                                        locale: tr,
                                                    })
                                                    : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {recipient.openedAt ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-blue-50 text-blue-700"
                                                    >
                                                        {format(
                                                            new Date(recipient.openedAt),
                                                            "d MMM HH:mm",
                                                            { locale: tr }
                                                        )}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {recipient.clickedAt ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-green-50 text-green-700"
                                                    >
                                                        {format(
                                                            new Date(recipient.clickedAt),
                                                            "d MMM HH:mm",
                                                            { locale: tr }
                                                        )}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {recipients.length > 50 && (
                                <p className="text-sm text-gray-500 mt-4 text-center">
                                    İlk 50 alıcı gösteriliyor. Toplam: {recipients.length}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function CampaignAnalyticsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        }>
            <AnalyticsContent />
        </Suspense>
    );
}
