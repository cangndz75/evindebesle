"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrashIcon, PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type District = {
  id: string;
  name: string;
  createdAt: string;
};

export default function DistrictsPage() {
  const [data, setData] = useState<District[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/districts")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const handleAdd = async () => {
    const res = await fetch("/api/districts", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const newDistrict = await res.json();
      setData((prev) => [...prev, newDistrict]);
      setName("");
      setOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/districts/${id}`, { method: "DELETE" });
    setData((prev) => prev.filter((d) => d.id !== id));
  };

  const columns: ColumnDef<District>[] = [
    { accessorKey: "name", header: "İlçe" },
    {
      header: "Tarih",
      accessorKey: "createdAt",
      cell: ({ row }) =>
        new Date(row.getValue("createdAt")).toLocaleDateString("tr-TR"),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleDelete(row.original.id)}
        >
          <TrashIcon size={16} />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">İlçeler</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-2" size={16} /> Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogTitle>İlçe Ekle</DialogTitle>
            <div className="space-y-4">
              <div>
                <Label>İlçe Adı</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button onClick={handleAdd} disabled={!name}>
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
