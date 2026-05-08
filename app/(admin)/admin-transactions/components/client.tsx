"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { columns, Transaction } from "./columns";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { Separator } from "@/components/ui/separator";

export default function TransactionsClient() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fullyMask = (value: string | null | undefined) => {
        if (!value) return "********";
        return "*".repeat(Math.max(8, Math.min(16, value.length)));
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/admin/transactions?limit=100"); // Fetching last 100 for now, pagination handled in table client-side for this demo, or server-side if needed
                const result = await res.json();
                setData(result.transactions);
            } catch (error) {
                console.error("Failed to fetch transactions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleShowDetails = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsModalOpen(true);
    };

    const formattedColumns = columns(handleShowDetails);

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">İşlemler</h2>
                    <p className="text-muted-foreground">
                        Tüm ödeme ve sipariş işlemleri listesi
                    </p>
                </div>
            </div>
            <Separator className="my-4" />
            <DataTable
                searchKey="orderNumber"
                columns={formattedColumns}
                data={data}
                loading={loading}
                onExport={() => {
                    const header = ["Order ID", "Customer", "Email", "Total", "Status", "Date"];
                    const rows = data.map(t => [
                        t.orderNumber,
                        t.user.name,
                        fullyMask(t.email || t.user.email),
                        t.total,
                        t.paymentStatus,
                        t.createdAt
                    ]);
                    const csvContent = "data:text/csv;charset=utf-8,"
                        + header.join(",") + "\n"
                        + rows.map(e => e.join(",")).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "transactions.csv");
                    document.body.appendChild(link);
                    link.click();
                }}
            />
            <TransactionDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                transaction={selectedTransaction}
            />
        </>
    );
}
