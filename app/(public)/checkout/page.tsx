"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useCartStore } from "@/lib/stores/cartStore";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

declare global {
    interface Window {
        iyzico: any;
    }
}

export default function CheckoutPage() {
    const { items: cart, refreshCart } = useCartStore();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);

    // Calculate total
    const totalPrice = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        addressLine1: "",
        city: "",
        country: "Turkey",
        zipCode: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async () => {
        if (!cart || cart.length === 0) {
            toast.error("Sepetiniz boş!");
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
                    email: session?.user?.email || formData.email,
                    items: cart.map(item => ({
                        productId: item.productId,
                        colorId: item.colorId,
                        sizeId: item.sizeId,
                        quantity: item.quantity,
                        colorName: item.color?.name,
                        sizeName: item.size?.name
                    })),
                    billingAddress: formData,
                    shippingAddress: formData, // Simplified for now
                    shippingPrice: totalPrice > 500 ? 0 : 50, // Example logic, should come from server
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Render Checkout Form
            if (data.checkoutFormContent) {
                const scriptStart = '<script type="text/javascript">';
                const scriptEnd = '</script>';

                // Extract script content or render raw html carefully
                // Iyzico usually sends a script block. We need to execute it.
                // A safer way for Next.js is injecting the HTML into a div.

                const container = document.getElementById("iyzico-checkout-form");
                if (container) {
                    container.innerHTML = data.checkoutFormContent + '<div id="iyzipay-checkout-form" class="responsive"></div>';
                    // Evaluate scripts
                    const scripts = container.getElementsByTagName('script');
                    for (let i = 0; i < scripts.length; i++) {
                        // eslint-disable-next-line no-eval
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

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Ödeme</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Adres Bilgileri</h2>
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input name="firstName" placeholder="Ad" onChange={handleChange} className="border p-2 rounded w-full" />
                            <input name="lastName" placeholder="Soyad" onChange={handleChange} className="border p-2 rounded w-full" />
                        </div>
                        <input name="email" placeholder="Email" onChange={handleChange} className="border p-2 rounded w-full" />
                        <input name="phone" placeholder="Telefon" onChange={handleChange} className="border p-2 rounded w-full" />
                        <input name="addressLine1" placeholder="Adres" onChange={handleChange} className="border p-2 rounded w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <input name="city" placeholder="Şehir" onChange={handleChange} className="border p-2 rounded w-full" />
                            <input name="zipCode" placeholder="Posta Kodu" onChange={handleChange} className="border p-2 rounded w-full" />
                        </div>
                    </form>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Ödeme</h2>
                    <div id="iyzico-checkout-form" className="min-h-[400px]">
                        {!loading && (
                            <button
                                onClick={handleCheckout}
                                className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition"
                            >
                                Ödeme Formunu Yükle
                            </button>
                        )}
                        {loading && <p className="text-center text-gray-500">Yükleniyor...</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
