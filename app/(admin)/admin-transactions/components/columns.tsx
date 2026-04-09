"use strict";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export type Transaction = {
    id: string;
    orderNumber: string;
    total: number;
    paymentStatus: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
        image: string | null;
    };
    email: string | null;
    items: any[];
    shippingAddress: any;
    billingAddress: any;
    payment: any;
};

export const columns = (showDetails: (transaction: Transaction) => void): ColumnDef<Transaction>[] => [
    {
        accessorKey: "orderNumber",
        header: "Sipariş No",
    },
    {
        accessorKey: "user.name",
        header: "Müşteri",
        cell: ({ row }) => {
            const user = row.original.user;
            const email = row.original.email || user.email;
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{user?.name || "Misafir"}</span>
                    <span className="text-xs text-muted-foreground">{email}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "total",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Tutar
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("total"));
            const formatted = new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: "TRY",
            }).format(amount);

            return <div className="font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "paymentStatus",
        header: "Ödeme Durumu",
        cell: ({ row }) => {
            const status = row.getValue("paymentStatus") as string;
            let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
            let label = status;
            let className = "";

            switch (status) {
                case "PAID":
                case "SUCCESS":
                case "SUCCEEDED":
                case "PAYMENT_SUCCESS":
                    variant = "outline";
                    label = "Ödendi";
                    className = "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
                    break;
                case "PENDING":
                case "PENDING_PAYMENT":
                    variant = "secondary";
                    label = "Ödeme Bekleniyor";
                    className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
                    break;
                case "FAILED":
                case "PAYMENT_FAILED":
                case "PAYMENT_CAPTURE_FAILED":
                    variant = "destructive";
                    label = "Ödeme Başarısız";
                    break;
                case "REFUNDED":
                    variant = "outline";
                    label = "İade Edildi";
                    className = "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200";
                    break;
                default:
                    variant = "outline";
            }

            return <Badge variant={variant} className={className}>{label}</Badge>;
        },
    },
    {
        accessorKey: "createdAt",
        header: "Tarih",
        cell: ({ row }) => {
            return (
                <div>
                    {format(new Date(row.getValue("createdAt")), "d MMMM yyyy HH:mm", {
                        locale: tr,
                    })}
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const transaction = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menüyü aç</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => showDetails(transaction)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Detayları Gör
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
