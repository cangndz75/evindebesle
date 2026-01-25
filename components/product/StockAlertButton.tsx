"use client";

import { useState } from "react";
import { BellRing, Mail, Check, Loader2 } from "lucide-react";
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

interface StockAlertButtonProps {
    productId: string;
    variantId?: string;
    variantName?: string;
    className?: string;
}

export default function StockAlertButton({ productId, variantId, variantName, className = "" }: StockAlertButtonProps) {
    const [email, setEmail] = useState("");
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
            const res = await fetch("/api/products/stock-alert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    variantId,
                    email,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                toast.success("Stok bildirimi oluşturuldu!");
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
                <Button variant="outline" className={`w-full ${className}`}>
                    <BellRing className="w-4 h-4 mr-2" />
                    Stok Gelince Haber Ver
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Stok Bildirimi</DialogTitle>
                    <DialogDescription>
                        {variantName
                            ? `${variantName} seçeneği stoğa girdiğinde size haber verelim.`
                            : "Bu ürün stoğa girdiğinde size e-posta ile haber verelim."}
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center py-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-lg font-medium">Bildirim Oluşturuldu!</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Ürün stoğa girdiğinde size e-posta göndereceğiz.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                                Bu ürün şu anda stokta yok. Stoğa girdiğinde size haber verelim.
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
                                <BellRing className="w-4 h-4 mr-2" />
                            )}
                            Beni Haberdar Et
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
