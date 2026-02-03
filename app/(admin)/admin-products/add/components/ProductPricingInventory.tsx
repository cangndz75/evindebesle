import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RotateCw, RefreshCw } from "lucide-react";
import React from "react";

interface ProductPricingInventoryProps {
    price: string;
    setPrice: (value: string) => void;
    originalPrice: string;
    setOriginalPrice: (value: string) => void;
    sku: string;
    setSku: (value: string) => void;
    barcode: string;
    setBarcode: (value: string) => void;
    isTrackInventory: boolean;
    setIsTrackInventory: (value: boolean) => void;
    stock: number;
    setStock: (value: number) => void;
    isVariable: boolean;
    allowBackorders: boolean;
    setAllowBackorders: (value: boolean) => void;
    isTaxable: boolean;
    setIsTaxable: (value: boolean) => void;
}

export function ProductPricingInventory({
    price, setPrice,
    originalPrice, setOriginalPrice,
    sku, setSku,
    barcode, setBarcode,
    isTrackInventory, setIsTrackInventory,
    stock, setStock,
    isVariable,
    allowBackorders, setAllowBackorders,
    isTaxable, setIsTaxable
}: ProductPricingInventoryProps) {

    const generateRandomSKU = () => {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setSku(`PRD-${random}`);
    };

    const generateRandomBarcode = () => {
        const random = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        setBarcode(random);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Pricing & Inventory</h2>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                    <Label htmlFor="price" className="text-gray-700 font-medium">
                        Price <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="pl-7"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="comparePrice" className="text-gray-700 font-medium">
                        Compare at Price
                    </Label>
                    <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <Input
                            id="comparePrice"
                            type="number"
                            step="0.01"
                            value={originalPrice}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOriginalPrice(e.target.value)}
                            placeholder="0.00"
                            className="pl-7"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="cost" className="text-gray-700 font-medium">
                        Cost per Item
                    </Label>
                    <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <Input
                            id="cost"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7 bg-gray-50"
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Inventory Header */}
            <div className="flex items-center justify-between mb-4 border-t pt-6">
                <h3 className="text-base font-semibold text-gray-900">Inventory</h3>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="trackInventory"
                        checked={isTrackInventory}
                        onCheckedChange={(c) => setIsTrackInventory(c as boolean)}
                    />
                    <Label htmlFor="trackInventory" className="text-sm cursor-pointer ml-1 text-gray-600">
                        Track inventory
                    </Label>
                </div>
            </div>

            {/* Inventory Actions */}
            {isTrackInventory && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <Label htmlFor="sku" className="text-gray-700 font-medium">SKU (Stock Keeping Unit)</Label>
                        <div className="flex gap-2 mt-1.5">
                            <Input
                                id="sku"
                                value={sku}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSku(e.target.value)}
                                placeholder="SKU-001"
                            />
                            <Button type="button" variant="outline" size="icon" onClick={generateRandomSKU} title="Generate Random SKU">
                                <RefreshCw className="w-4 h-4 text-gray-500" />
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="barcode" className="text-gray-700 font-medium">Barcode (ISBN, UPC, GTIN)</Label>
                        <div className="flex gap-2 mt-1.5">
                            <Input
                                id="barcode"
                                value={barcode}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBarcode(e.target.value)}
                                placeholder="ISBN, UPC, GTIN, etc."
                            />
                            <Button type="button" variant="outline" size="icon" onClick={generateRandomBarcode} title="Generate Random Barcode">
                                <RotateCw className="w-4 h-4 text-gray-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Quantity for Simple Product */}
            {isTrackInventory && !isVariable && (
                <div className="mb-4">
                    <Label htmlFor="stock" className="text-gray-700 font-medium">Stock Quantity</Label>
                    <Input
                        id="stock"
                        type="number"
                        value={stock}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStock(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1.5 w-full md:w-1/2"
                    />
                </div>
            )}

            {/* Backorders */}
            <div className="flex items-center gap-2 mb-6">
                <Checkbox
                    id="backorders"
                    checked={allowBackorders}
                    onCheckedChange={(c) => setAllowBackorders(c as boolean)}
                />
                <Label htmlFor="backorders" className="text-sm font-normal text-gray-600 cursor-pointer">
                    Allow backorders when out of stock
                </Label>
            </div>

            {/* Tax */}
            <div className="flex items-center gap-2 border-t pt-6">
                <Checkbox
                    id="taxable"
                    checked={isTaxable}
                    onCheckedChange={(c) => setIsTaxable(c as boolean)}
                />
                <Label htmlFor="taxable" className="text-sm font-medium text-gray-900 cursor-pointer">
                    This product is taxable
                </Label>
            </div>
        </div>
    );
}
