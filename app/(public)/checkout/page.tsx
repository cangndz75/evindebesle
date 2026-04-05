"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, Wallet } from "lucide-react";

declare global {
    interface Window {
        iyzico: any;
    }
}

export default function CheckoutPage() {
    const { items: cart, refreshCart, couponCode, discountAmount, applyCoupon, removeCoupon } = useCartStore();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);

    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        addressLine1: "",
        apartment: "",
        city: "",
        zipCode: "",
        phone: "",
        country: "Turkey" // Default
    });

    const [freeShippingThreshold, setFreeShippingThreshold] = useState(99);
    const [shippingCost, setShippingCost] = useState(49.90);

    const [couponInput, setCouponInput] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "TEST">("CREDIT_CARD");

    useEffect(() => {
        const init = async () => {
            await refreshCart();
            if (status === "authenticated" && session?.user) {
                setFormData(prev => ({
                    ...prev,
                    email: session.user.email || "",
                    firstName: session.user.name?.split(" ")[0] || "",
                    lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
                }));
            }
            setInitLoading(false);
        };
        init();
    }, [refreshCart, session, status]);

    useEffect(() => {
        fetch("/api/company-settings")
            .then(res => res.json())
            .then(data => {
                setFreeShippingThreshold(Number(data.freeShippingThreshold) || 99);
                setShippingCost(Number(data.shippingPrice) || 49.90);
            })
            .catch(() => { });
    }, []);


    const subtotal = cart.reduce((acc, item) => {
        const price = item.product.price;
        return acc + (price * item.quantity);
    }, 0);
    const shippingPrice = subtotal >= freeShippingThreshold ? 0 : shippingCost;
    const total = Math.max(0, subtotal + shippingPrice - discountAmount);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponLoading(true);
        const res = await applyCoupon(couponInput);
        setCouponLoading(false);
        if (res.success) {
            toast.success(res.message);
            setCouponInput("");
        } else {
            toast.error(res.message);
        }
    };

    const handleCheckout = async (methodOverride?: "CREDIT_CARD" | "TEST") => {
        const methodToUse = methodOverride || paymentMethod;

        if (!cart || cart.length === 0) {
            toast.error("Sepetiniz boş!");
            return;
        }

        if (!formData.email || !formData.firstName || !formData.lastName || !formData.addressLine1 || !formData.city || !formData.phone) {
            toast.error("Lütfen tüm zorunlu alanları doldurunuz.");
            return;
        }

        setLoading(true);

        try {
            const idempotencyKey = crypto.randomUUID();

            const res = await fetch("/api/checkout/initialize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Idempotency-Key": idempotencyKey,
                },
                body: JSON.stringify({
                    userId: session?.user?.id,
                    email: formData.email,
                    items: cart.map(item => ({
                        productId: item.productId,
                        colorId: item.colorId,
                        sizeId: item.sizeId,
                        quantity: item.quantity,
                        colorName: item.color?.name,
                        sizeName: item.size?.name
                    })),
                    billingAddress: formData,
                    shippingAddress: formData, // Keeping it simple: shipping = billing
                    shippingPrice: shippingPrice,
                    paymentMethod: methodToUse, // CREDIT_CARD or TEST
                    couponCode: couponCode
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            if (data.status === "success" && data.paymentPageUrl) {
                window.location.href = data.paymentPageUrl;
            }
            else if (data.checkoutFormContent) {
                const container = document.getElementById("iyzico-checkout-form");
                if (container) {
                    container.innerHTML = data.checkoutFormContent + '<div id="iyzipay-checkout-form" class="responsive"></div>';
                    const scripts = container.getElementsByTagName('script');
                    for (let i = 0; i < scripts.length; i++) {
                        window.eval(scripts[i].innerText);
                    }
                }
            } else if (data.paymentPageUrl) {
                window.location.href = data.paymentPageUrl;
            }

        } catch (error: any) {
            toast.error(error.message || "Ödeme başlatılamadı");
        } finally {
            setLoading(false);
        }
    };

    if (initLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="container mx-auto px-4 py-12 md:py-20 max-w-lg text-center">
                <h1 className="text-3xl font-serif font-light mb-4">Giriş Yapın</h1>
                <p className="text-gray-500 mb-8 font-light">
                    Siparişinizi tamamlamak için lütfen giriş yapın veya üye olun.
                </p>
                <div className="flex flex-col gap-4">
                    <Link
                        href="/auth-tabs?mode=login&redirect=/checkout"
                        className="w-full bg-black text-white py-4 rounded text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                        Giriş Yap
                    </Link>
                    <Link
                        href="/auth-tabs?mode=register&redirect=/checkout"
                        className="w-full bg-white text-black border border-black py-4 rounded text-sm uppercase tracking-widest hover:bg-gray-50 transition-colors"
                    >
                        Üye Ol
                    </Link>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Devam ederek Kullanım Koşulları ve Gizlilik Politikamızı kabul etmiş olursunuz.
                    </p>
                </div>
            </div>
        );
    }

    if (!cart || cart.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-serif mb-4">Sepetiniz Boş</h1>
                <Link href="/men" className="text-blue-600 underline">Alışverişe Başla</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-8 py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                
                <div className="lg:col-span-7 space-y-10">

                    
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-medium">İletişim</h2>
                            {session?.user ? (
                                <span className="text-sm text-gray-500">Giriş yapıldı: {session.user.email}</span>
                            ) : (
                                <Link href="/auth-tabs" className="text-sm underline">Giriş Yap</Link>
                            )}
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="E-posta adresi"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black transition-colors"
                        />
                        <div className="mt-2 flex items-center gap-2">
                            <input type="checkbox" id="newsletter" className="rounded border-gray-300" />
                            <label htmlFor="newsletter" className="text-sm text-gray-600">Kampanyalardan ve fırsatlardan haberdar olmak istiyorum</label>
                        </div>
                    </div>

                    
                    <div>
                        <h2 className="text-xl font-medium mb-4">Teslimat Adresi</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1">
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded p-3 bg-white focus:outline-none focus:border-black"
                                >
                                    <option value="Turkey">Türkiye</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="Ad"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black"
                                />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Soyad"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black"
                                />
                            </div>
                            <input
                                type="text"
                                name="addressLine1"
                                placeholder="Adres"
                                value={formData.addressLine1}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black"
                            />
                            <input
                                type="text"
                                name="apartment"
                                placeholder="Apartman, daire vb. (opsiyonel)"
                                value={formData.apartment}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black"
                            />
                            <div className="grid grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    name="city"
                                    placeholder="Şehir"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black"
                                />
                                <input
                                    type="text"
                                    name="zipCode"
                                    placeholder="Posta Kodu"
                                    value={formData.zipCode}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black col-span-2"
                                />
                            </div>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Telefon"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:border-black"
                            />
                        </div>
                    </div>

                    
                    <div className="block lg:hidden">
                        <h2 className="text-xl font-medium mb-4">İndirim Kodu</h2>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="İndirim kodu"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                className="flex-1 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-black"
                            />
                            <button
                                onClick={handleApplyCoupon}
                                disabled={couponLoading || !couponInput.trim()}
                                className="bg-gray-200 text-gray-700 px-4 rounded text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                {couponLoading ? "..." : "Uygula"}
                            </button>
                        </div>
                        {couponCode && (
                            <div className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-200">
                                <span className="text-sm text-green-700 font-medium">{couponCode}</span>
                                <button onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700">Kaldır</button>
                            </div>
                        )}
                    </div>

                    
                    <div>
                        <h2 className="text-xl font-medium mb-4">Kargo Yöntemi</h2>
                        <div className="border border-gray-200 rounded p-4 flex justify-between items-center bg-gray-50">
                            <span className="text-sm">Standart Kargo (1-3 İş Günü)</span>
                            <span className="font-medium">{shippingPrice === 0 ? "Ücretsiz" : `${shippingPrice} TL`}</span>
                        </div>
                    </div>

                    
                    <div>
                        <h2 className="text-xl font-medium mb-2">Ödeme</h2>
                        <p className="text-sm text-gray-500 mb-4">Tüm işlemler şifreli ve güvenlidir.</p>

                        <div className="border border-gray-200 rounded overflow-hidden">
                            
                            <div className={`p-4 border-b border-gray-200 flex items-center gap-3 cursor-pointer ${paymentMethod === "CREDIT_CARD" ? "bg-gray-50" : "bg-white"}`}
                                onClick={() => setPaymentMethod("CREDIT_CARD")}
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === "CREDIT_CARD" ? "border-black" : "border-gray-300"}`}>
                                    {paymentMethod === "CREDIT_CARD" && <div className="w-2 h-2 rounded-full bg-black" />}
                                </div>
                                <span className="flex-1 font-medium">Kredi / Banka Kartı</span>
                                <div className="flex gap-1">
                                    
                                    {["visa", "mastercard"].map(brand => (
                                        <div key={brand} className="w-8 h-5 bg-gray-200 rounded text-[8px] flex items-center justify-center uppercase text-gray-500">{brand}</div>
                                    ))}
                                </div>
                            </div>

                            
                            {paymentMethod === "CREDIT_CARD" && (
                                <div className="p-6 bg-gray-50 border-b border-gray-200 text-center">
                                    <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600 mb-4">
                                        Güvenli ödeme sayfasına yönlendirileceksiniz.
                                    </p>

                                    
                                    <div id="iyzico-checkout-form" className="min-h-[10px]"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => handleCheckout("CREDIT_CARD")}
                            disabled={loading}
                            className="w-full bg-black text-white py-4 rounded font-medium text-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && paymentMethod === "CREDIT_CARD" ? "İşleniyor..." : `Ödemeyi Tamamla • ${total.toFixed(2)} TL`}
                        </button>

                        
                        
                    </div>

                    <div className="text-xs text-gray-400 text-center mt-4">
                        All rights reserved Goodhood
                    </div>

                </div>

                
                <div className="lg:col-span-5">
                    <div className="bg-gray-50 p-6 rounded-lg sticky top-24">
                        <h2 className="text-xl font-medium mb-6">Sipariş Özeti</h2>

                        
                        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative w-16 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                        {item.product.image ? (
                                            <Image
                                                src={item.product.image}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                        )}
                                        <div className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-md">
                                            {item.quantity}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium leading-tight mb-1">{item.product.name}</h3>
                                        <p className="text-xs text-gray-500 mb-1">{item.size?.name} {item.color?.name && `• ${item.color.name}`}</p>
                                    </div>
                                    <div className="text-sm font-medium flex flex-col items-end">
                                        <span>{(item.product.price * item.quantity).toFixed(2)} TL</span>
                                        {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                            <span className="text-[10px] text-gray-400 line-through">
                                                {(item.product.originalPrice * item.quantity).toFixed(2)} TL
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        
                        <div className="hidden lg:flex gap-2 mb-6">
                            <input
                                type="text"
                                placeholder="İndirim kodu"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                className="flex-1 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-black"
                            />
                            <button
                                onClick={handleApplyCoupon}
                                disabled={couponLoading || !couponInput.trim()}
                                className="bg-gray-200 text-gray-700 px-4 rounded text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                {couponLoading ? "..." : "Uygula"}
                            </button>
                        </div>

                        
                        {couponCode && (
                            <div className="hidden lg:flex justify-between items-center bg-green-50 p-2 rounded border border-green-200 mb-4">
                                <span className="text-sm text-green-700 font-medium">{couponCode}</span>
                                <button onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700">Kaldır</button>
                            </div>
                        )}

                        
                        <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ara Toplam</span>
                                <span>{subtotal.toFixed(2)} TL</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Kargo</span>
                                <span>{shippingPrice === 0 ? "Ücretsiz" : `${shippingPrice.toFixed(2)} TL`}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>İndirim</span>
                                    <span>-{discountAmount.toFixed(2)} TL</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 mt-2">
                                <span>Toplam</span>
                                <span>{total.toFixed(2)} TL</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Vergiler dahildir</p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
