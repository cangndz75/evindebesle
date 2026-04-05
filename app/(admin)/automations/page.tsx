import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
    const automations = await prisma.automation.findMany({
        include: { _count: { select: { userFlows: true } } }
    });

    const stats = await Promise.all(automations.map(async (auto: any) => {
        const campaignId = `automation-${auto.id}`;
        const sends = await prisma.emailSend.count({ where: { campaignId } });
        const opens = await prisma.emailSend.count({ where: { campaignId, openedAt: { not: null } } });
        const clicks = await prisma.emailSend.count({ where: { campaignId, clickedAt: { not: null } } });
        const conversions = await prisma.emailSend.count({ where: { campaignId, convertedAt: { not: null } } });
        const revenue = await prisma.emailSend.aggregate({ where: { campaignId }, _sum: { revenue: true } });

        return {
            ...auto,
            sends,
            opens,
            clicks,
            conversions,
            revenue: revenue._sum.revenue || 0
        };
    }));

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Otomasyonlar</h1>
                
            </div>

            <div className="grid gap-6">
                {stats.map((stat: any) => (
                    <Card key={stat.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex flex-col space-y-1">
                                <CardTitle className="text-lg font-medium">
                                    {stat.name}
                                </CardTitle>
                                <span className="text-sm text-muted-foreground">{stat.triggerType}</span>
                            </div>
                            <Badge variant={stat.isActive ? "default" : "secondary"}>
                                {stat.isActive ? "Aktif" : "Pasif"}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Gönderim</span>
                                    <span className="text-2xl font-bold">{stat.sends}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Açılma</span>
                                    <span className="text-2xl font-bold">
                                        %{stat.sends ? ((stat.opens / stat.sends) * 100).toFixed(1) : "0.0"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{stat.opens} email</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Tıklama</span>
                                    <span className="text-2xl font-bold">
                                        %{stat.sends ? ((stat.clicks / stat.sends) * 100).toFixed(1) : "0.0"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{stat.clicks} email</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Dönüşüm</span>
                                    <span className="text-2xl font-bold">{stat.conversions}</span>
                                    <span className="text-xs text-muted-foreground">Sipariş</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Ciro</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stat.revenue)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {stats.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        Henüz otomasyon oluşturulmamış. Veritabanı seed işlemi veya manuel ekleme yapın.
                    </div>
                )}
            </div>
        </div>
    );
}
