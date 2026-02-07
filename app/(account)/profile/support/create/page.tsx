"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const formSchema = z.object({
    subject: z.string().min(5, "Konu en az 5 karakter olmalıdır").max(100, "Konu çok uzun"),
    category: z.string().min(1, "Lütfen bir kategori seçin"),
    message: z.string().min(10, "Mesajınız en az 10 karakter olmalıdır"),
    orderId: z.string().optional(),
});

export default function CreateSupportTicketPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subject: "",
            message: "",
            orderId: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/support", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("Bir hata oluştu");
            }

            toast.success("Destek talebiniz oluşturuldu");
            router.push("/profile/support");
            router.refresh();
        } catch (error) {
            toast.error("Talep oluşturulurken bir sorun çıktı");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/profile/support">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Yeni Destek Talebi</h1>
                    <p className="text-sm text-muted-foreground">
                        Sorununuzu detaylı bir şekilde açıklarsanız size daha hızlı yardımcı olabiliriz.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Talep Formu</CardTitle>
                    <CardDescription>
                        Lütfen aşağıdaki formu eksiksiz doldurun.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kategori</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sorununuz ne ile ilgili?" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="order">Sipariş Durumu</SelectItem>
                                                <SelectItem value="payment">Ödeme İşlemleri</SelectItem>
                                                <SelectItem value="return">İade ve Değişim</SelectItem>
                                                <SelectItem value="product">Ürün Bilgisi</SelectItem>
                                                <SelectItem value="other">Diğer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Konu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: Siparişim kargoya verilmedi" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="orderId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sipariş Numarası (Opsiyonel)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: 123456" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Eğer sorununuz belirli bir siparişle ilgiliyse belirtiniz.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mesajınız</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
                                                className="min-h-[150px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-3 pt-4">
                                <Link href="/profile/support">
                                    <Button type="button" variant="outline">İptal</Button>
                                </Link>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Talebi Gönder
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
