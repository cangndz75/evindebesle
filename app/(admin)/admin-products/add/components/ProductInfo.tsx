import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Verified path
import React from "react";

interface ProductInfoProps {
    name: string;
    setName: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
}

export function ProductInfo({ name, setName, description, setDescription }: ProductInfoProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Product Information</h2>

            <div className="space-y-6">
                <div>
                    <Label htmlFor="name" className="text-gray-700 font-medium">
                        Product Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        placeholder="e.g., Premium Cotton T-Shirt"
                        className="mt-1.5"
                    />
                </div>

                <div>
                    <Label htmlFor="description" className="text-gray-700 font-medium">
                        Description
                    </Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        placeholder="Describe your product features, materials, and benefits..."
                        className="mt-1.5 min-h-[160px] resize-y"
                    />
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full border border-gray-300 bg-gray-50 flex items-center justify-center text-[8px]">i</span>
                        Rich formatting will be available after initial save
                    </p>
                </div>
            </div>
        </div>
    );
}
