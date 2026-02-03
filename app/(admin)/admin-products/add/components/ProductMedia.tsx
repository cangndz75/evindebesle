import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import React from "react";

interface ProductMediaProps {
    uploadedImages: string[];
    primaryImage: string;
    setPrimaryImage: (url: string) => void;
    secondaryImage: string;
    setSecondaryImage: (url: string) => void;
    onFilesSelected: (files: FileList) => void;
    onRemoveImage: (index: number) => void;
}

export function ProductMedia({
    uploadedImages,
    primaryImage, setPrimaryImage,
    secondaryImage, setSecondaryImage,
    onFilesSelected, onRemoveImage
}: ProductMediaProps) {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFilesSelected(e.dataTransfer.files);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Medya Dosyaları</h2>
                    <p className="text-sm text-gray-500">Ürün görsellerini yükleyin ve varyantlara atayın</p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2 bg-gray-900 text-white hover:bg-gray-800 border-transparent shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-4 h-4" /> Görsel Yükle
                </Button>
            </div>

            <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${dragActive ? "border-black bg-blue-50/50" : "border-gray-200 hover:border-gray-300 bg-gray-50/30"}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files) {
                            onFilesSelected(e.target.files);
                            e.target.value = ""; // Reset
                        }
                    }}
                />

                {uploadedImages.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-1">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Henüz görsel yüklenmedi</h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2"
                        >
                            İlk Görseli Yükle
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
                        {uploadedImages.map((img, index) => (
                            <div key={index} className="group relative aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <Image src={img} alt="" fill className="object-cover" />

                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onRemoveImage(index); }}
                                            className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-medium">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (secondaryImage === img) setSecondaryImage("");
                                                setPrimaryImage(img);
                                            }}
                                            className={`py-1 rounded px-1 transition-colors ${primaryImage === img ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-green-50'}`}
                                        >
                                            Ana
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (primaryImage === img) setPrimaryImage("");
                                                setSecondaryImage(img);
                                            }}
                                            className={`py-1 rounded px-1 transition-colors ${secondaryImage === img ? 'bg-blue-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-blue-50'}`}
                                        >
                                            Hover
                                        </button>
                                    </div>
                                </div>

                                {/* Badges */}
                                {!dragActive && (
                                    <>
                                        {primaryImage === img && <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500 text-white text-[10px] uppercase font-bold rounded shadow-sm">Ana</div>}
                                        {secondaryImage === img && <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-[10px] uppercase font-bold rounded shadow-sm">Hover</div>}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-xs text-blue-800 space-y-1">
                <h4 className="font-semibold mb-1">Görsel Kuralları</h4>
                <ul className="list-disc pl-4 space-y-0.5 opacity-80">
                    <li>Yüksek çözünürlüklü görseller kullanın (en az 1000x1000px)</li>
                    <li>İlk görsel varsayılan olarak ana ürün görseli olacaktır</li>
                    <li>Daha iyi bir müşteri deneyimi için renk varyantlarına özel görseller atayın</li>
                </ul>
            </div>
        </div>
    );
}
