"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    Sparkles,
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
import { toast } from "sonner";

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

interface AbandonedProductUser {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    marketingEmailConsent: boolean;
}

interface AbandonedProduct {
    product: {
        id: string;
        name: string;
        price: number;
        image: string | null;
    };
    quantity: number;
    value: number;
    users: AbandonedProductUser[];
    usersCount: number;
    consentedUsersCount: number;
    nonConsentedUsersCount: number;
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
    abandonedProducts: AbandonedProduct[];
    dailyTrend: Array<{ date: string; count: number }>;
}

export default function AbandonedCartsPage() {
    const router = useRouter();
    const [data, setData] = useState<AbandonedCartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AbandonedCartUser | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<AbandonedProduct | null>(null);
    const [viewMode, setViewMode] = useState<"cart" | "product">("cart");

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

    const formatInTurkey = (
        value: string,
        options: Intl.DateTimeFormatOptions
    ) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat("tr-TR", {
            timeZone: "Europe/Istanbul",
            ...options,
        }).format(date);
    };

    const buildAbandonedCartCampaignDraft = (
        targetEmail?: string,
        targetCart?: AbandonedCartUser
    ) => {
        const isSingle = !!targetEmail && !!targetCart;
        const carts = isSingle ? [targetCart!] : (data?.abandonedCarts || []);
        const topProducts = isSingle
            ? targetCart!.items.slice(0, 4)
            : (data?.topAbandonedProducts?.slice(0, 4) || []).map((p) => ({
                product: p.product,
                quantity: p.count,
                value: p.value,
            }));

        const totalUsers = isSingle ? 1 : (data?.abandonedCarts.length || 0);
        const totalRevenue = isSingle
            ? targetCart!.totalValue
            : (data?.summary.totalPotentialRevenue || 0);

        const userName = isSingle ? (targetCart!.user.name || "Değerli Müşterimiz") : "{{first_name}}";
        const greeting = isSingle
            ? `Merhaba <strong>${userName}</strong>,`
            : `Merhaba <strong>{{first_name|Değerli Müşterimiz}}</strong>,`;

        const productBlocks = topProducts.flatMap((item, idx) => [
            {
                id: `img-prod-${idx}`,
                type: "image" as const,
                content: {
                    imageUrl: item.product.image || "",
                    altText: item.product.name,
                    linkUrl: `https://dark-velvet.com/product/${item.product.id}`,
                    align: "center",
                    width: "280px",
                },
                style: { padding: "8px 20px", backgroundColor: "#ffffff" },
                visibility: { mobile: true, desktop: true },
            },
            {
                id: `txt-prod-${idx}`,
                type: "text" as const,
                content: {
                    text: `<p style="font-size:16px;font-weight:bold;text-align:center;color:#000;margin:4px 0;">${item.product.name}</p><p style="font-size:14px;text-align:center;color:#666;margin:0 0 12px;">${formatPrice(item.value || item.product.price)}</p>`,
                },
                style: { padding: "0 20px 8px", backgroundColor: "#ffffff" },
                visibility: { mobile: true, desktop: true },
            },
        ]);

        return {
            id: null,
            name: isSingle
                ? `Sepet Hatırlatma — ${targetCart!.user.name || targetEmail}`
                : `Terk Edilen Sepet Kampanyası — ${totalUsers} kullanıcı`,
            status: "draft",
            subject: "Sepetinizde ürünler sizi bekliyor!",
            preheader: "Beğendiğiniz ürünler tükenmeden alışverişinizi tamamlayın",
            fromName: "Dark Velvet",
            fromEmail: "info@dark-velvet.com",
            replyTo: "info@dark-velvet.com",
            recipientEmail: targetEmail || undefined,
            audienceSegmentId: isSingle ? null : "active",
            scheduleAt: null,
            blocks: [
                {
                    id: "header-1",
                    type: "header",
                    content: {
                        logoUrl: "https://dark-velvet.com/images/logo.png",
                        align: "center",
                        backgroundColor: "#ffffff",
                        padding: "20px",
                    },
                    style: {},
                    visibility: { mobile: true, desktop: true },
                },
                {
                    id: "hero-1",
                    type: "hero",
                    content: {
                        imageUrl: "",
                        title: "Sepetinizi Unutmayın",
                        subtitle: "Seçtiğiniz ürünler hâlâ sizi bekliyor",
                        backgroundColor: "#111111",
                        textColor: "#ffffff",
                        align: "center",
                    },
                    style: { padding: "32px 20px", backgroundColor: "#111111" },
                    visibility: { mobile: true, desktop: true },
                },
                {
                    id: "text-greeting",
                    type: "text",
                    content: {
                        text: `<p style="font-size:16px;line-height:1.7;text-align:center;color:#333;padding:0 16px;">${greeting}<br><br>Sepetinizde bıraktığınız ürünler hâlâ mevcut. Stoklar sınırlı — kaçırmadan alışverişinizi tamamlayın!</p>`,
                    },
                    style: { padding: "24px 20px 8px", backgroundColor: "#ffffff" },
                    visibility: { mobile: true, desktop: true },
                },
                {
                    id: "divider-1",
                    type: "divider",
                    content: {},
                    style: { padding: "8px 40px", backgroundColor: "#ffffff" },
                    visibility: { mobile: true, desktop: true },
                },
                ...productBlocks,
                {
                    id: "cta-1",
                    type: "cta",
                    content: {
                        text: "Alışverişi Tamamla",
                        url: "https://dark-velvet.com/cart",
                        align: "center",
                        backgroundColor: "#000000",
                        textColor: "#ffffff",
                        borderRadius: "6px",
                        padding: "14px 32px",
                    },
                    style: { padding: "24px 20px", backgroundColor: "#ffffff" },
                    visibility: { mobile: true, desktop: true },
                },
                {
                    id: "text-urgency",
                    type: "text",
                    content: {
                        text: `<p style="font-size:13px;text-align:center;color:#999;padding:0 20px;">Tüm siparişlerde <strong>ücretsiz kargo</strong> ve <strong>30 gün kolay iade</strong> garantisi.</p>`,
                    },
                    style: { padding: "0 20px 24px", backgroundColor: "#ffffff" },
                    visibility: { mobile: true, desktop: true },
                },
                {
                    id: "footer-1",
                    type: "footer",
                    content: {
                        text: `© ${new Date().getFullYear()} Dark Velvet. Tüm hakları saklıdır.`,
                        socialHidden: false,
                        siteLink: "https://dark-velvet.com",
                        address: "İstanbul, Türkiye",
                    },
                    style: { padding: "20px", backgroundColor: "#f9fafb" },
                    visibility: { mobile: true, desktop: true },
                },
            ],
        };
    };

    const handleSendEmail = (email: string) => {
        const cart = data?.abandonedCarts.find((c) => c.user.email === email);
        if (!cart) return;

        const draft = buildAbandonedCartCampaignDraft(email, cart);
        localStorage.setItem("abandonedCartDraft", JSON.stringify(draft));
        router.push("/campaigns");
    };

    const handleBulkCampaign = () => {
        const draft = buildAbandonedCartCampaignDraft();
        localStorage.setItem("abandonedCartDraft", JSON.stringify(draft));
        router.push("/campaigns");
    };

    const handleProductBulkCampaign = (product: AbandonedProduct) => {
        const consentedUsers = product.users.filter((user) => user.marketingEmailConsent);
        const uniqueEmails = Array.from(
            new Set(consentedUsers.map((user) => user.email.trim().toLowerCase()).filter(Boolean))
        );

        if (uniqueEmails.length === 0) {
            toast.error("Pazarlama izni olan alıcı bulunamadı");
            return;
        }

        if (product.nonConsentedUsersCount > 0) {
            toast.info(`${product.nonConsentedUsersCount} kişi pazarlama izni olmadığı için hariç tutuldu`);
        }

        const productPreview = {
            product: product.product,
            quantity: product.quantity,
            value: product.value,
        };

        const draft = {
            ...buildAbandonedCartCampaignDraft(),
            name: `${product.product.name} • Terk Edenlere Kampanya`,
            subject: `${product.product.name} sizi bekliyor`,
            preheader: `${uniqueEmails.length} kisiye ozel urun hatirlatma`,
            audienceSegmentId: null,
            recipientEmail: undefined,
            recipientEmails: uniqueEmails,
            blocks: [
                {
                    id: "header-1",
                    type: "header" as const,
                    content: {
                        logoUrl: "https://dark-velvet.com/images/logo.png",
                        align: "center",
                        backgroundColor: "#ffffff",
                        padding: "20px",
                    },
                    style: {},
                    visibility: { mobile: true, desktop: true },
                },
                {
                    id: "hero-1",
                    type: "hero" as const,
                    content: {
                        imageUrl: product.product.image || "",
                        title: `${product.product.name}`,
                        subtitle: "Sepetinizdeki urunu kacirmayin",
                        backgroundColor: "#0f172a",
                        textColor: "#ffffff",
                        align: "center",
                    },
                    style: { padding: "28px 20px", backgroundColor: "#0f172a" },
                    visibility: { mobile: true, desktop: true },
                },
                {
                    id: "text-focus",
                    type: "text" as const,
                    content: {
                        text: `<p style="font-size:16px;line-height:1.7;text-align:center;color:#333;padding:0 16px;">Merhaba <strong>{{first_name|Degerli Musterimiz}}</strong>,<br><br>Sepetinizde biraktiginiz <strong>${product.product.name}</strong> hala stokta. Tukenmeden alisverisinizi tamamlayin.</p>`,
                    },
                    style: { padding: "24px 20px 8px", backgroundColor: "#ffffff" },
                    visibility: { mobile: true, desktop: true },
                },
                ...[
                    {
                        id: "img-prod-0",
                        type: "image" as const,
                        content: {
                            imageUrl: productPreview.product.image || "",
                            altText: productPreview.product.name,
                            linkUrl: `https://dark-velvet.com/product/${productPreview.product.id}`,
                            align: "center",
                            width: "280px",
                        },
                        style: { padding: "8px 20px", backgroundColor: "#ffffff" },
                        visibility: { mobile: true, desktop: true },
                    },
                    {
                        id: "txt-prod-0",
                        type: "text" as const,
                        content: {
                            text: `<p style="font-size:16px;font-weight:bold;text-align:center;color:#000;margin:4px 0;">${productPreview.product.name}</p><p style="font-size:14px;text-align:center;color:#666;margin:0 0 12px;">${formatPrice(productPreview.value)}</p>`,
                        },
                        style: { padding: "0 20px 8px", backgroundColor: "#ffffff" },
                        visibility: { mobile: true, desktop: true },
                    },
                ],
                {
                    id: "cta-1",
                    type: "cta" as const,
                    content: {
                        text: "Urunu Simdi Al",
                        url: `https://dark-velvet.com/product/${product.product.id}`,
                        align: "center",
                        backgroundColor: "#000000",
                        textColor: "#ffffff",
                        borderRadius: "6px",
                        padding: "14px 32px",
                    },
                    style: { padding: "24px 20px", backgroundColor: "#ffffff" },
                    visibility: { mobile: true, desktop: true },
                },
                {
                    id: "footer-1",
                    type: "footer" as const,
                    content: {
                        text: `© ${new Date().getFullYear()} Dark Velvet. Tum haklari saklidir.`,
                        socialHidden: false,
                        siteLink: "https://dark-velvet.com",
                        address: "Istanbul, Turkiye",
                    },
                    style: { padding: "20px", backgroundColor: "#f9fafb" },
                    visibility: { mobile: true, desktop: true },
                },
            ],
        };

        localStorage.setItem("abandonedCartDraft", JSON.stringify(draft));
        router.push("/campaigns");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="admin-page space-y-6">
            
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
                    <Button
                        onClick={handleBulkCampaign}
                        disabled={!data?.abandonedCarts?.length}
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Kampanya Oluştur
                    </Button>
                </div>
            </div>

            
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

                <Card className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white">
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

            <Card>
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Gorunum Tipi</p>
                        <p className="text-xs text-gray-500">Sepet bazli ve urun bazli analiz arasinda gecis yapin</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant={viewMode === "cart" ? "default" : "outline"}
                            onClick={() => setViewMode("cart")}
                        >
                            Sepet Bazli
                        </Button>
                        <Button
                            type="button"
                            variant={viewMode === "product" ? "default" : "outline"}
                            onClick={() => setViewMode("product")}
                        >
                            Urun Bazli
                        </Button>
                    </div>
                </CardContent>
            </Card>

            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <Card>
                    <CardHeader>
                        <CardTitle>Günlük Trend</CardTitle>
                        <CardDescription>Son 7 günde terk edilen sepet sayısı</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data?.dailyTrend || []}>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        try {
                                            const date = new Date(value);
                                            if (isNaN(date.getTime())) return value;
                                            return formatInTurkey(value, { day: "numeric", month: "short" });
                                        } catch {
                                            return value;
                                        }
                                    }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            let formattedLabel = label;
                                            try {
                                                if (label) {
                                                    const normalizedLabel = String(label);
                                                    const date = new Date(normalizedLabel);
                                                    if (!isNaN(date.getTime())) {
                                                        formattedLabel = formatInTurkey(normalizedLabel, {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        });
                                                    }
                                                }
                                            } catch { }

                                            return (
                                                <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-lg text-xs">
                                                    <p className="font-semibold mb-1">{formattedLabel}</p>
                                                    <p className="text-orange-600">
                                                        Sepet: {payload[0].value}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                
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

            
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{viewMode === "cart" ? "Terk Edilen Sepetler" : "Terk Edilen Urunler"}</CardTitle>
                            <CardDescription>
                                {viewMode === "cart"
                                    ? "Son 7 gun icinde sepetini terk eden kullanicilar"
                                    : "Son 7 gun icinde sepette birakilan urunlerin urun bazli dagilimi"}
                            </CardDescription>
                        </div>
                        <Badge variant="secondary">
                            {viewMode === "cart"
                                ? `${data?.abandonedCarts.length || 0} kullanici`
                                : `${data?.abandonedProducts.length || 0} urun`}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            {viewMode === "cart" ? (
                                <TableRow>
                                    <TableHead>Kullanici</TableHead>
                                    <TableHead>Urun Sayisi</TableHead>
                                    <TableHead>Sepet Degeri</TableHead>
                                    <TableHead>Son Guncelleme</TableHead>
                                    <TableHead className="text-right">Islemler</TableHead>
                                </TableRow>
                            ) : (
                                <TableRow>
                                    <TableHead>Urun</TableHead>
                                    <TableHead>Terk Eden Kullanici</TableHead>
                                    <TableHead>Toplam Adet</TableHead>
                                    <TableHead>Potansiyel Gelir</TableHead>
                                    <TableHead>Son Guncelleme</TableHead>
                                    <TableHead className="text-right">Islemler</TableHead>
                                </TableRow>
                            )}
                        </TableHeader>
                        <TableBody>
                            {viewMode === "cart" &&
                                data?.abandonedCarts.map((cart) => (
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
                                            <Badge variant="outline">{cart.itemCount} urun</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-emerald-600">{formatPrice(cart.totalValue)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-500">
                                                {formatInTurkey(cart.lastUpdated, {
                                                    day: "2-digit",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
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

                            {viewMode === "product" &&
                                data?.abandonedProducts.map((entry) => (
                                    <TableRow key={entry.product.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                    {entry.product.image ? (
                                                        <Image
                                                            src={entry.product.image}
                                                            alt={entry.product.name}
                                                            width={40}
                                                            height={40}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <Package className="w-5 h-5 m-2.5 text-gray-400" />
                                                    )}
                                                </div>
                                                <p className="font-medium text-gray-900 truncate">{entry.product.name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{entry.usersCount} kullanici</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{entry.quantity} adet</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-emerald-600">{formatPrice(entry.value)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-500">
                                                {formatInTurkey(entry.lastUpdated, {
                                                    day: "2-digit",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleProductBulkCampaign(entry)}
                                                >
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    Toplu Taslak
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedProduct(entry)}
                                                >
                                                    Detay
                                                    <ExternalLink className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {((viewMode === "cart" && (!data?.abandonedCarts || data.abandonedCarts.length === 0)) ||
                                (viewMode === "product" && (!data?.abandonedProducts || data.abandonedProducts.length === 0))) && (
                                <TableRow>
                                    <TableCell colSpan={viewMode === "cart" ? 5 : 6} className="text-center py-8 text-gray-500">
                                        Bu gorunumde veri bulunmuyor
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            
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
                                <Button className="flex-1" onClick={() => handleSendEmail(selectedUser.user.email)}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    E-posta Gönder
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{selectedProduct.product.name}</CardTitle>
                                    <CardDescription>
                                        {selectedProduct.usersCount} kullanici • {selectedProduct.quantity} adet • {formatPrice(selectedProduct.value)}
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>
                                    ✕
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-sky-50 p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-indigo-900">Hizli Aksiyon</p>
                                        <p className="text-xs text-indigo-700 mt-1">
                                            Bu urunu terk eden tum kullanicilar icin tek tikla toplu kampanya taslagi olustur.
                                        </p>
                                        <p className="text-xs text-indigo-700 mt-2">
                                            Izinli: {selectedProduct.consentedUsersCount} • Izinsiz: {selectedProduct.nonConsentedUsersCount}
                                        </p>
                                    </div>
                                    <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                                </div>
                                <Button
                                    className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700"
                                    onClick={() => handleProductBulkCampaign(selectedProduct)}
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Bu Urunu Terk Edenlere Toplu Kampanya Taslagi
                                </Button>
                            </div>

                            {selectedProduct.users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">{user.name || "Anonim"}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        <p className={`text-[11px] mt-0.5 ${user.marketingEmailConsent ? "text-emerald-600" : "text-amber-600"}`}>
                                            {user.marketingEmailConsent ? "Pazarlama izni var" : "Pazarlama izni yok"}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSendEmail(user.email)}
                                        disabled={!user.marketingEmailConsent}
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        E-posta
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
