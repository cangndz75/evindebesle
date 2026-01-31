"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UnsubscribePage() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const email = searchParams.get("email");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call to unsubscribe
        const unsubscribe = async () => {
            if (id || email) {
                try {
                    // In a real app, you would call an endpoint here.
                    // await fetch('/api/unsubscribe', { method: 'POST', body: JSON.stringify({ id, email }) });
                    // For now, we assume it's successful as per request to just show the page.
                    console.log("Unsubscribing user:", id || email);
                } catch (error) {
                    console.error("Unsubscribe error", error);
                }
            }
            setLoading(false);
        };

        unsubscribe();
    }, [id, email]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                </div>

                <p className="text-gray-900 font-medium text-lg leading-relaxed">
                    Aboneliği iptal etme talebiniz alınmıştır. Tekrar mail almak isterseniz "Hesabım" sayfasından izin tercihlerinizi güncelleyebilirsiniz.
                </p>

                <div className="pt-4">
                    <Link href="/">
                        <Button className="w-full bg-[#1A1A1A] hover:bg-black text-white h-12 rounded-md font-medium">
                            Ana Sayfaya Dön
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
