"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, Send, Loader2, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

interface TicketDetail {
    id: string;
    subject: string;
    category: string;
    status: string;
    createdAt: string;
    messages: Message[];
}

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [replyMessage, setReplyMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: ticket, mutate, isLoading } = useSWR<TicketDetail>(
        params.id ? `/api/support/${params.id}` : null,
        fetcher,
        { refreshInterval: 5000 } // Poll every 5s for new messages
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
            const response = await fetch(`/api/support/${params.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: replyMessage }),
            });

            if (!response.ok) throw new Error("Mesaj gönderilemedi");

            setReplyMessage("");
            mutate(); // Refresh messages
        } catch (error) {
            toast.error("Mesaj gönderilirken bir hata oluştu");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Talep bulunamadı</h2>
                <Link href="/profile/support">
                    <Button variant="link" className="mt-2">Listeye Dön</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4 shrink-0">
                <Link href="/profile/support">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-xl font-bold truncate">{ticket.subject}</h1>
                        <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                            {ticket.status === 'open' ? 'Açık' : ticket.status}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex gap-2">
                        <span>#{ticket.id.slice(-6)}</span>
                        <span>•</span>
                        <span>{format(new Date(ticket.createdAt), "d MMMM yyyy HH:mm", { locale: tr })}</span>
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-gray-200">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {ticket.messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-3 max-w-[85%]",
                                !msg.isAdmin ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                !msg.isAdmin ? "bg-black text-white" : "bg-blue-100 text-blue-600"
                            )}>
                                {!msg.isAdmin ? <User className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                            </div>
                            <div className={cn(
                                "rounded-2xl px-4 py-3 text-sm shadow-sm",
                                !msg.isAdmin
                                    ? "bg-black text-white rounded-tr-none"
                                    : "bg-white border border-gray-100 rounded-tl-none text-gray-800"
                            )}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <div className={cn(
                                    "text-[10px] mt-1 opacity-70",
                                    !msg.isAdmin ? "text-gray-300 text-right" : "text-gray-400"
                                )}>
                                    {format(new Date(msg.createdAt), "HH:mm", { locale: tr })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    {ticket.status === 'closed' ? (
                        <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed text-gray-500 text-sm">
                            Bu talep kapatılmıştır. Yeni bir cevap yazamazsınız.
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Bir cevap yazın..."
                                className="min-h-[50px] max-h-[150px] resize-none"
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
                    )}
                </div>
            </Card>
        </div>
    );
}
