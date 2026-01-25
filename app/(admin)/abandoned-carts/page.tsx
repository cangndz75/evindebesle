"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    ShoppingCart,
    Users,
    TrendingUp,
    Package,
    Mail,
    ArrowLeft,
    RefreshCw,
    ExternalLink,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import Image from "next/image";

interface AbandonedCartUser {
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
    items: Array<{
        product: {
            id: string;
            name: string;
            price: number;
            image: string | null;
        };
        quantity: number;
        size?: string;
        color?: string;
        value: number;
    }>;
    totalValue: number;
    itemCount: number;
    lastUpdated: string;
}

interface AbandonedCartData {
    summary: {
        today: { users: number; items: number };
        week: { users: number; items: number };
        month: { users: number; items: number };
        totalPotentialRevenue: number;
    };
    abandonedCarts: AbandonedCartUser[];
    topAbandonedProducts: Array<{
        product: { id: string; name: string; price: number; image: string | null };
        count: number;
        value: number;
    }>;
    dailyTrend: Array<{ date: string; count: number }>;
}

export default function AbandonedCartsPage() {
    const router = useRouter();
    const [data, setData] = useState<AbandonedCartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AbandonedCartUser | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/abandoned-carts");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Error fetching abandoned carts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatPrice = (value: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Terk Edilen Sepetler</h1>
                        <p className="text-sm text-gray-500">Detaylı analiz ve otomasyon</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Yenile
                    </Button>
                    <Button onClick={() => router.push("/campaigns")}>
                        <Mail className="w-4 h-4 mr-2" />
                        Kampanya Oluştur
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Bugün</p>
                                <p className="text-2xl font-bold">{data?.summary.today.users || 0}</p>
                                <p className="text-xs text-gray-400">{data?.summary.today.items || 0} ürün</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <ShoppingCart className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Bu Hafta</p>
                                <p className="text-2xl font-bold">{data?.summary.week.users || 0}</p>
                                <p className="text-xs text-gray-400">{data?.summary.week.items || 0} ürün</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Bu Ay</p>
                                <p className="text-2xl font-bold">{data?.summary.month.users || 0}</p>
                                <p className="text-xs text-gray-400">{data?.summary.month.items || 0} ürün</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-100">Potansiyel Gelir</p>
                                <p className="text-2xl font-bold">{formatPrice(data?.summary.totalPotentialRevenue || 0)}</p>
                                <p className="text-xs text-emerald-200">Kurtarılabilir tutar</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Günlük Trend</CardTitle>
                        <CardDescription>Son 7 günde terk edilen sepet sayısı</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data?.dailyTrend || []}>
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Abandoned Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>En Çok Terk Edilen Ürünler</CardTitle>
                        <CardDescription>Sepette bırakılan ürünler</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data?.topAbandonedProducts.slice(0, 5).map((item, index) => (
                            <div key={item.product.id} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                                    {item.product.image ? (
                                        <Image
                                            src={item.product.image}
                                            alt={item.product.name}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <Package className="w-5 h-5 m-2.5 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                                    <p className="text-xs text-gray-500">{item.count} adet • {formatPrice(item.value)}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Abandoned Carts List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Terk Edilen Sepetler</CardTitle>
                            <CardDescription>Son 7 gün içinde sepetini terk eden kullanıcılar</CardDescription>
                        </div>
                        <Badge variant="secondary">{data?.abandonedCarts.length || 0} kullanıcı</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kullanıcı</TableHead>
                                <TableHead>Ürün Sayısı</TableHead>
                                <TableHead>Sepet Değeri</TableHead>
                                <TableHead>Son Güncelleme</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.abandonedCarts.map((cart) => (
                                <TableRow key={cart.user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                                                {cart.user.name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{cart.user.name || "Anonim"}</p>
                                                <p className="text-xs text-gray-500">{cart.user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{cart.itemCount} ürün</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-semibold text-emerald-600">{formatPrice(cart.totalValue)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-500">
                                            {format(new Date(cart.lastUpdated), "d MMM HH:mm", { locale: tr })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedUser(cart)}
                                        >
                                            Detay
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!data?.abandonedCarts || data.abandonedCarts.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Henüz terk edilen sepet yok
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{selectedUser.user.name || "Anonim Kullanıcı"}</CardTitle>
                                    <CardDescription>{selectedUser.user.email}</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                                    ✕
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Toplam Değer</span>
                                <span className="font-bold text-emerald-600">{formatPrice(selectedUser.totalValue)}</span>
                            </div>
                            <div className="border-t pt-4 space-y-3">
                                {selectedUser.items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                            {item.product.image ? (
                                                <Image
                                                    src={item.product.image}
                                                    alt={item.product.name}
                                                    width={48}
                                                    height={48}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <Package className="w-6 h-6 m-3 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{item.product.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.size && `Beden: ${item.size}`} {item.color && `• Renk: ${item.color}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{formatPrice(item.value)}</p>
                                            <p className="text-xs text-gray-500">x{item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t flex gap-2">
                                <Button className="flex-1" onClick={() => router.push(`/campaigns?email=${selectedUser.user.email}`)}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    E-posta Gönder
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
