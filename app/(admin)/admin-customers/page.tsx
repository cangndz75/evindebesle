"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Mail, Phone, Package, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const maskNameToInitials = (name: string) => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) return "--";

    return parts
      .slice(0, 2)
      .map((part) => `${part[0]?.toUpperCase()}.`)
      .join(" ");
  };

  const fullyMask = (value: string | null | undefined) => {
    if (!value) return "********";
    return "*".repeat(Math.max(8, Math.min(16, value.length)));
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return customer.name.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Müşteri Yönetimi</h1>
          <p className="text-sm text-gray-600 mt-1">Müşteri bilgilerini görüntüleyin ve yönetin</p>
        </div>
      </div>

      
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Müşteri adı ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Müşteri bulunamadı
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Müşteriler ({filteredCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Sipariş Sayısı</TableHead>
                    <TableHead>Toplam Harcama</TableHead>
                    <TableHead>Son Sipariş</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={customer.image || ""} />
                            <AvatarFallback>
                              {customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium tracking-wide">{maskNameToInitials(customer.name)}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(customer.createdAt), "dd MMM yyyy", { locale: tr })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{fullyMask(customer.email)}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{fullyMask(customer.phone)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{customer.orderCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">{formatPrice(customer.totalSpent)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.lastOrderDate ? (
                          <span className="text-sm text-gray-600">
                            {format(new Date(customer.lastOrderDate), "dd MMM yyyy", { locale: tr })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Henüz sipariş yok</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
