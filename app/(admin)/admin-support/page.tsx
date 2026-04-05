"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Filter, Eye } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AdminTicket {
    id: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
    user: {
        name: string | null;
        email: string;
    };
    _count: {
        messages: number;
    };
}

interface APIResponse {
    tickets: AdminTicket[];
    total: number;
    totalPages: number;
    currentPage: number;
}

export default function AdminSupportPage() {
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useSWR<APIResponse>(
        `/api/admin/support?page=${page}&status=${statusFilter}`,
        fetcher
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open":
                return <Badge className="bg-green-500 hover:bg-green-600">Açık</Badge>;
            case "pending":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Beklemede</Badge>;
            case "resolved":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Çözüldü</Badge>;
            case "closed":
                return <Badge variant="outline" className="text-gray-500 border-gray-300">Kapalı</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Destek Talepleri</h1>
                <div className="flex items-center gap-2">
                    
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <CardTitle>Talepler</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="w-50">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Durum Filtrele" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tümü</SelectItem>
                                        <SelectItem value="open">Açık</SelectItem>
                                        <SelectItem value="pending">Beklemede</SelectItem>
                                        <SelectItem value="resolved">Çözüldü</SelectItem>
                                        <SelectItem value="closed">Kapalı</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Konu</TableHead>
                                        <TableHead>Kullanıcı</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Son Güncelleme</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.tickets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                Kayıt bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.tickets.map((ticket) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {ticket.id.slice(-6)}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {ticket.subject}
                                                    {ticket._count.messages > 1 && (
                                                        <Badge variant="secondary" className="ml-2 text-[10px] h-5">
                                                            {ticket._count.messages}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{ticket.user.name || "İsimsiz"}</span>
                                                        <span className="text-xs text-muted-foreground">{ticket.user.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{ticket.category}</TableCell>
                                                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(ticket.updatedAt), "d MMM HH:mm", { locale: tr })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/admin-support/${ticket.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            İncele
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
