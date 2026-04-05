"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, Send, Loader2, User, ShieldCheck, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Message {
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
}

interface AdminTicketDetail {
    id: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
        image: string | null;
    };
    messages: Message[];
    order?: {
        orderNumber: string;
        total: number;
        status: string;
    };
}

export default function AdminTicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [replyMessage, setReplyMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: ticket, mutate, isLoading } = useSWR<AdminTicketDetail>(
        params.id ? `/api/admin/support/${params.id}` : null,
        fetcher
    );

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [ticket?.messages]);

    const handleSendMessage = async () => {
        if (!replyMessage.trim()) return;

        setIsSending(true);
        try {
            const response = await fetch(`/api/admin/support/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminReply: replyMessage }),
            });

            if (!response.ok) throw new Error("Mesaj gönderilemedi");

            setReplyMessage("");
            toast.success("Yanıt gönderildi");
            mutate();
        } catch (error) {
            toast.error("Mesaj gönderilirken hata oluştu");
        } finally {
            setIsSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdatingStatus(true);
        try {
            const response = await fetch(`/api/admin/support/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error("Durum güncellenemedi");

            toast.success("Durum güncellendi");
            mutate();
        } catch (error) {
            toast.error("Durum güncellenirken hata oluştu");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold">Talep bulunamadı</h2>
                <Link href="/admin-support">
                    <Button variant="link">Listeye Dön</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar with Ticket Info */}
            <aside className="w-80 bg-white border-r flex flex-col overflow-y-auto">
                <div className="p-4 border-b">
                    <Link href="/admin-support">
                        <Button variant="ghost" size="sm" className="mb-2">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Listeye Dön
                        </Button>
                    </Link>
                    <h2 className="font-bold text-lg leading-tight">{ticket.subject}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{ticket.category}</Badge>
                        <Badge variant="outline" className={cn(
                            ticket.priority === 'urgent' ? 'text-red-600 border-red-200 bg-red-50' : ''
                        )}>
                            {ticket.priority}
                        </Badge>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Status Control */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Durum</label>
                        <Select
                            value={ticket.status}
                            onValueChange={handleStatusChange}
                            disabled={isUpdatingStatus}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Açık</SelectItem>
                                <SelectItem value="pending">Beklemede</SelectItem>
                                <SelectItem value="resolved">Çözüldü</SelectItem>
                                <SelectItem value="closed">Kapalı</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* User Info */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Kullanıcı</label>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-medium truncate">{ticket.user.name || "İsimsiz"}</p>
                                <p className="text-xs text-muted-foreground truncate" title={ticket.user.email}>{ticket.user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Related Order */}
                    {ticket.order && (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">İlgili Sipariş</label>
                            <Card className="bg-gray-50">
                                <CardContent className="p-3 text-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium">#{ticket.order.orderNumber}</span>
                                        <Badge variant="secondary" className="text-[10px] h-5">{ticket.order.status}</Badge>
                                    </div>
                                    <div className="text-right font-bold text-gray-700">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(ticket.order.total)}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="text-xs text-gray-400 pt-4 border-t">
                        Oluşturulma: {format(new Date(ticket.createdAt), "d MMMM yyyy HH:mm", { locale: tr })}
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {ticket.messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-4 max-w-3xl",
                                msg.isAdmin ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                msg.isAdmin ? "bg-blue-600 text-white" : "bg-white text-gray-600"
                            )}>
                                {msg.isAdmin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </div>
                            <div className={cn(
                                "rounded-2xl px-5 py-3 text-sm shadow-sm",
                                msg.isAdmin
                                    ? "bg-blue-600 text-white rounded-tr-none"
                                    : "bg-white border border-gray-100 rounded-tl-none text-gray-800"
                            )}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                <div className={cn(
                                    "text-[10px] mt-1.5 opacity-70",
                                    msg.isAdmin ? "text-blue-100 text-right" : "text-gray-400"
                                )}>
                                    {format(new Date(msg.createdAt), "HH:mm, d MMM", { locale: tr })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <Textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Yanıtınızı yazın..."
                            className="min-h-[80px] resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={isSending || !replyMessage.trim()}
                            className="h-auto px-6"
                        >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
