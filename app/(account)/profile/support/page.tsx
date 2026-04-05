"use client";

import Link from "next/link";
import useSWR from "swr";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SupportTicket {
    id: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        messages: number;
    };
}

export default function SupportPage() {
    const { data: tickets, isLoading } = useSWR<SupportTicket[]>("/api/support", fetcher);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open":
                return <Badge className="bg-green-500 hover:bg-green-600">AÃ§Ä±k</Badge>;
            case "pending":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Beklemede</Badge>;
            case "resolved":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Ã‡Ã¶zÃ¼ldÃ¼</Badge>;
            case "closed":
                return <Badge variant="outline" className="text-gray-500 border-gray-300">KapalÄ±</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            order: "SipariÅŸ",
            payment: "Ã–deme",
            return: "Ä°ade/DeÄŸiÅŸim",
            product: "ÃœrÃ¼n",
            other: "DiÄŸer",
        };
        return labels[category] || category;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Destek Taleplerim</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        SorularÄ±nÄ±z ve talepleriniz iÃ§in buradan bizimle iletiÅŸime geÃ§ebilirsiniz.
                    </p>
                </div>
                <Link href="/profile/support/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Talep
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : tickets && tickets.length > 0 ? (
                <div className="grid gap-4">
                    {tickets.map((ticket) => (
                        <Link key={ticket.id} href={`/profile/support/${ticket.id}`}>
                            <Card className="hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-black">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-medium">
                                            {ticket.subject}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 text-xs">
                                            <span>#{ticket.id.slice(-6)}</span>
                                            <span>â€¢</span>
                                            <span>{format(new Date(ticket.createdAt), "d MMMM yyyy HH:mm", { locale: tr })}</span>
                                            <span>â€¢</span>
                                            <span className="font-medium text-gray-900">{getCategoryLabel(ticket.category)}</span>
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {getStatusBadge(ticket.status)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>{ticket._count.messages} mesaj</span>
                                        </div>
                                        <div>
                                            Son GÃ¼ncelleme: {format(new Date(ticket.updatedAt), "d MMM HH:mm", { locale: tr })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <MessageSquare className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="font-semibold text-lg mb-1">HenÃ¼z bir talebiniz yok</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mb-6">
                            SipariÅŸleriniz veya Ã¼rÃ¼nlerimiz hakkÄ±nda merak ettikleriniz iÃ§in yeni bir destek talebi oluÅŸturabilirsiniz.
                        </p>
                        <Link href="/profile/support/create">
                            <Button variant="outline">Talep OluÅŸtur</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
