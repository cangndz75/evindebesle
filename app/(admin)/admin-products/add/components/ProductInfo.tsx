import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Verified path
import React from "react";

interface ProductInfoProps {
    name: string;
    setName: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    gender?: "MALE" | "FEMALE" | "UNISEX";
    setGender: (value: "MALE" | "FEMALE" | "UNISEX") => void;
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Add this import

export function ProductInfo({ name, setName, description, setDescription, gender, setGender }: ProductInfoProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Ürün Bilgileri</h2>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name" className="text-gray-700 font-medium">
                            Ürün Adı <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            placeholder="Örn: Premium Pamuklu Tişört"
                            className="mt-1.5"
                        />
                    </div>
                    <div>
                        <Label className="text-gray-700 font-medium">Cinsiyet</Label>
                        <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                            <SelectTrigger className="mt-1.5 bg-white">
                                <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MALE">Erkek</SelectItem>
                                <SelectItem value="FEMALE">Kadın</SelectItem>
                                <SelectItem value="UNISEX">Unisex</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <Label htmlFor="description" className="text-gray-700 font-medium">
                        Açıklama
                    </Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        placeholder="Ürün özelliklerini, materyal bilgisini ve faydalarını açıklayın..."
                        className="mt-1.5 min-h-[160px] resize-y"
                    />
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full border border-gray-300 bg-gray-50 flex items-center justify-center text-[8px]">i</span>
                        Zengin metin (Rich Text) özellikleri ürün kaydedildikten sonra aktif olacaktır.
                    </p>
                </div>
            </div>
        </div>
    );
}
