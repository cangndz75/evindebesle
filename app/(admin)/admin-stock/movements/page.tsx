"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type StockMovement = {
    id: string;
    type: "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "DAMAGED";
    quantity: number;
    reason: string | null;
    createdAt: string;
    product: {
        name: string;
        image: string | null;
    };
    variant: {
        colorName?: string;
        sizeName?: string;
    } | null;
    user: {
        name: string;
    } | null;
};

export default function StockMovementsPage() {
    const router = useRouter();
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMovements();
    }, []);

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/stock/movements");
            if (res.ok) {
                const data = await res.json();
                setMovements(data);
            }
        } catch (error) {
            console.error("Error fetching movements:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "PURCHASE":
                return <Badge className="bg-green-100 text-green-800">AlÄ±m</Badge>;
            case "SALE":
                return <Badge className="bg-blue-100 text-blue-800">SatÄ±ÅŸ</Badge>;
            case "RETURN":
                return <Badge className="bg-purple-100 text-purple-800">Ä°ade</Badge>;
            case "ADJUSTMENT":
                return <Badge className="bg-gray-100 text-gray-800">DÃ¼zeltme</Badge>;
            case "DAMAGED":
                return <Badge className="bg-red-100 text-red-800">HasarlÄ±</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    const getQuantityDisplay = (type: string, qty: number) => {
        const isPositive = type === "PURCHASE" || type === "RETURN";


        const sign = (type === "PURCHASE" || type === "RETURN") ? "+" : "-";
        const color = (type === "PURCHASE" || type === "RETURN") ? "text-green-600" : "text-red-600";
        const Icon = (type === "PURCHASE" || type === "RETURN") ? ArrowUpCircle : ArrowDownCircle;

        return (
            <div className={`flex items-center gap-1 font-bold ${color}`}>
                <Icon className="w-4 h-4" />
                <span>{sign}{qty}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Stok GeÃ§miÅŸi</h1>
                    <p className="text-sm text-gray-600">ÃœrÃ¼n hareket kayÄ±tlarÄ±</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">KayÄ±t bulunamadÄ±.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>ÃœrÃ¼n</TableHead>
                                    <TableHead>Varyant</TableHead>
                                    <TableHead>Ä°ÅŸlem</TableHead>
                                    <TableHead>Miktar</TableHead>
                                    <TableHead>AÃ§Ä±klama</TableHead>
                                    <TableHead>KullanÄ±cÄ±</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="text-gray-600 text-sm">
                                            {format(new Date(m.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {m.product.image && (
                                                    <img
                                                        src={m.product.image}
                                                        alt={m.product.name}
                                                        className="w-8 h-8 rounded object-cover border"
                                                    />
                                                )}
                                                <span className="font-medium text-sm">{m.product.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {m.variant ? (
                                                <span>
                                                    {m.variant.colorName} {m.variant.sizeName && `- ${m.variant.sizeName}`}
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>{getTypeBadge(m.type)}</TableCell>
                                        <TableCell>{getQuantityDisplay(m.type, m.quantity)}</TableCell>
                                        <TableCell className="text-sm text-gray-600 max-w-[200px] truncate" title={m.reason || ""}>
                                            {m.reason || "-"}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {m.user?.name || "Sistem"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
