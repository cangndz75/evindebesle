"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { WashingInstructionModal } from "@/components/admin/WashingInstructionModal";
import { DeliveryInfoModal } from "@/components/admin/DeliveryInfoModal";
import { SizeNoteModal } from "@/components/admin/SizeNoteModal";
import { SizeGuideModal } from "@/components/admin/SizeGuideModal";
import { ModelInfoModal } from "@/components/admin/ModelInfoModal";
import { toast } from "sonner";

export default function AdminTemplatesPage() {
    const [washingInstructions, setWashingInstructions] = useState<any[]>([]);
    const [deliveryInfos, setDeliveryInfos] = useState<any[]>([]);
    const [sizeNotes, setSizeNotes] = useState<any[]>([]);
    const [sizeGuides, setSizeGuides] = useState<any[]>([]);
    const [modelInfos, setModelInfos] = useState<any[]>([]);

    const [washingModal, setWashingModal] = useState(false);
    const [deliveryModal, setDeliveryModal] = useState(false);
    const [sizeNoteModal, setSizeNoteModal] = useState(false);
    const [sizeGuideModal, setSizeGuideModal] = useState(false);
    const [modelInfoModal, setModelInfoModal] = useState(false);

    const [editData, setEditData] = useState<any>(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = () => {
        fetchWashing();
        fetchDelivery();
        fetchSizeNotes();
        fetchSizeGuides();
        fetchModelInfo();
    };

    const fetchWashing = async () => {
        const res = await fetch("/api/admin/washing-instructions");
        const data = await res.json();
        setWashingInstructions(data);
    };

    const fetchDelivery = async () => {
        const res = await fetch("/api/admin/delivery-info");
        const data = await res.json();
        setDeliveryInfos(data);
    };

    const fetchSizeNotes = async () => {
        const res = await fetch("/api/admin/size-notes");
        const data = await res.json();
        setSizeNotes(data);
    };

    const fetchSizeGuides = async () => {
        const res = await fetch("/api/admin/size-guides");
        const data = await res.json();
        setSizeGuides(data);
    };

    const fetchModelInfo = async () => {
        const res = await fetch("/api/admin/model-info");
        const data = await res.json();
        setModelInfos(data);
    };

    const handleDelete = async (type: string, id: string) => {
        if (!confirm("Silmek istediğinizden emin misiniz?")) return;

        try {
            const endpoints: Record<string, string> = {
                washing: `/api/admin/washing-instructions/${id}`,
                delivery: `/api/admin/delivery-info/${id}`,
                sizeNote: `/api/admin/size-notes/${id}`,
                sizeGuide: `/api/admin/size-guides/${id}`,
                modelInfo: `/api/admin/model-info/${id}`,
            };

            const res = await fetch(endpoints[type], { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");

            toast.success("Silindi!");
            fetchAll();
        } catch (error) {
            toast.error("Silme başarısız");
        }
    };

    const openEdit = (type: string, data: any) => {
        setEditData(data);
        switch (type) {
            case "washing":
                setWashingModal(true);
                break;
            case "delivery":
                setDeliveryModal(true);
                break;
            case "sizeNote":
                setSizeNoteModal(true);
                break;
            case "sizeGuide":
                setSizeGuideModal(true);
                break;
            case "modelInfo":
                setModelInfoModal(true);
                break;
        }
    };

    const closeModal = () => {
        setEditData(null);
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Ürün Detay Şablonları</h1>
                <p className="text-gray-500">
                    Yıkama talimatları, teslimat bilgileri ve diğer şablonları yönetin
                </p>
            </div>

            <Tabs defaultValue="washing" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="washing">Yıkama</TabsTrigger>
                    <TabsTrigger value="delivery">Teslimat</TabsTrigger>
                    <TabsTrigger value="sizeNote">Beden Notu</TabsTrigger>
                    <TabsTrigger value="sizeGuide">Beden Rehberi</TabsTrigger>
                    <TabsTrigger value="modelInfo">Model Bilgisi</TabsTrigger>
                </TabsList>

                {/* Washing Instructions */}
                <TabsContent value="washing">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Yıkama Talimatları</CardTitle>
                                    <CardDescription>
                                        Ürünler için yıkama talimatı şablonları
                                    </CardDescription>
                                </div>
                                <Button onClick={() => { setEditData(null); setWashingModal(true); }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Yeni Ekle
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {washingInstructions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-start p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{item.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                {item.content}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit("washing", item)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete("washing", item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {washingInstructions.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">
                                        Henüz şablon eklenmemiş
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Delivery Info */}
                <TabsContent value="delivery">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Teslimat ve İade Bilgileri</CardTitle>
                                    <CardDescription>
                                        Teslimat ve iade bilgisi şablonları
                                    </CardDescription>
                                </div>
                                <Button onClick={() => { setEditData(null); setDeliveryModal(true); }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Yeni Ekle
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {deliveryInfos.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-start p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{item.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                {item.content}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit("delivery", item)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete("delivery", item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {deliveryInfos.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">
                                        Henüz şablon eklenmemiş
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Size Notes */}
                <TabsContent value="sizeNote">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Beden Notları</CardTitle>
                                    <CardDescription>
                                        Ürünler için beden notu şablonları
                                    </CardDescription>
                                </div>
                                <Button onClick={() => { setEditData(null); setSizeNoteModal(true); }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Yeni Ekle
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {sizeNotes.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-start p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{item.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                {item.content}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit("sizeNote", item)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete("sizeNote", item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {sizeNotes.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">
                                        Henüz şablon eklenmemiş
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Size Guides */}
                <TabsContent value="sizeGuide">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Beden Rehberleri</CardTitle>
                                    <CardDescription>
                                        Ürünler için beden rehberi şablonları
                                    </CardDescription>
                                </div>
                                <Button onClick={() => { setEditData(null); setSizeGuideModal(true); }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Yeni Ekle
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {sizeGuides.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-start p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{item.title}</h3>
                                            {item.imageUrl && (
                                                <p className="text-sm text-gray-500">Görsel mevcut</p>
                                            )}
                                            {item.content && (
                                                <p className="text-sm text-gray-500">Tablo verisi mevcut</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit("sizeGuide", item)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete("sizeGuide", item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {sizeGuides.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">
                                        Henüz şablon eklenmemiş
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Model Info */}
                <TabsContent value="modelInfo">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Model Bilgileri</CardTitle>
                                    <CardDescription>
                                        Ürünler için model bilgisi şablonları
                                    </CardDescription>
                                </div>
                                <Button onClick={() => { setEditData(null); setModelInfoModal(true); }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Yeni Ekle
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {modelInfos.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-start p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{item.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Boy: {item.height} | Beden: {item.size}
                                                {item.gender && ` | ${item.gender}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit("modelInfo", item)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete("modelInfo", item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {modelInfos.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">
                                        Henüz şablon eklenmemiş
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <WashingInstructionModal
                open={washingModal}
                onOpenChange={(open) => { setWashingModal(open); if (!open) closeModal(); }}
                onSuccess={() => { fetchWashing(); closeModal(); }}
                editData={editData}
            />
            <DeliveryInfoModal
                open={deliveryModal}
                onOpenChange={(open) => { setDeliveryModal(open); if (!open) closeModal(); }}
                onSuccess={() => { fetchDelivery(); closeModal(); }}
                editData={editData}
            />
            <SizeNoteModal
                open={sizeNoteModal}
                onOpenChange={(open) => { setSizeNoteModal(open); if (!open) closeModal(); }}
                onSuccess={() => { fetchSizeNotes(); closeModal(); }}
                editData={editData}
            />
            <SizeGuideModal
                open={sizeGuideModal}
                onOpenChange={(open) => { setSizeGuideModal(open); if (!open) closeModal(); }}
                onSuccess={() => { fetchSizeGuides(); closeModal(); }}
                editData={editData}
            />
            <ModelInfoModal
                open={modelInfoModal}
                onOpenChange={(open) => { setModelInfoModal(open); if (!open) closeModal(); }}
                onSuccess={() => { fetchModelInfo(); closeModal(); }}
                editData={editData}
            />
        </div>
    );
}
