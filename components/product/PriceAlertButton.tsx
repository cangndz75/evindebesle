"use client";

import { useState } from "react";
import { Bell, Mail, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PriceAlertButtonProps {
    productId: string;
    currentPrice: number;
    className?: string;
}

export default function PriceAlertButton({ productId, currentPrice, className = "" }: PriceAlertButtonProps) {
    const [email, setEmail] = useState("");
    const [targetPrice, setTargetPrice] = useState<number>(Math.floor(currentPrice * 0.9)); // %10 indirimli fiyat
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSubmit = async () => {
        if (!email) {
            toast.error("E-posta adresi gerekli");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/products/price-alert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    email,
                    targetPrice,
                    currentPrice,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                toast.success("Fiyat bildirimi oluşturuldu!");
                setTimeout(() => setOpen(false), 1500);
            } else {
                const data = await res.json();
                toast.error(data.error || "Bir hata oluştu");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={className}>
                    <Bell className="w-4 h-4 mr-2" />
                    Fiyat Düşünce Haber Ver
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Fiyat Bildirimi</DialogTitle>
                    <DialogDescription>
                        Fiyat istediğiniz seviyeye düştüğünde size e-posta ile haber verelim.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center py-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-lg font-medium">Bildirim Oluşturuldu!</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Fiyat {targetPrice?.toLocaleString("tr-TR")} ₺ altına düştüğünde size haber vereceğiz.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Mevcut Fiyat</label>
                            <div className="text-lg font-bold text-gray-900">
                                {currentPrice.toLocaleString("tr-TR")} ₺
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Hedef Fiyat (opsiyonel)</label>
                            <Input
                                type="number"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                                placeholder="Hedef fiyatınız"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Herhangi bir indirimde bildirim almak için boş bırakın
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">E-posta Adresiniz</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@email.com"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button onClick={handleSubmit} className="w-full" disabled={loading}>
                            {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Bell className="w-4 h-4 mr-2" />
                            )}
                            Bildirimi Oluştur
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
