import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import React from "react";

interface Category {
    id: string;
    name: string;
}

interface ProductSidebarProps {
    status: "draft" | "published" | "archived";
    setStatus: (value: "draft" | "published" | "archived") => void;
    categoryId: string;
    setCategoryId: (value: string) => void;
    categories: Category[];
    brand: string;
    setBrand: (value: string) => void;
    tags: string[];
    addTag: (tag: string) => void;
    removeTag: (tag: string) => void;
    slug: string;
    setSlug: (value: string) => void;
    seoTitle: string;
    setSeoTitle: (value: string) => void;
    seoDescription: string;
    setSeoDescription: (value: string) => void;
}

export function ProductSidebar({
    status, setStatus,
    categoryId, setCategoryId,
    categories,
    brand, setBrand,
    tags, addTag, removeTag,
    slug, setSlug,
    seoTitle, setSeoTitle,
    seoDescription, setSeoDescription
}: ProductSidebarProps) {
    const [newTag, setNewTag] = useState("");
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Status</h3>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status === 'published' ? 'bg-green-500' : status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                            <SelectValue placeholder="Select status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Organization Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Organization</h3>

                <div className="space-y-4">
                    <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Brand</Label>
                        <Input
                            value={brand}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrand(e.target.value)}
                            placeholder="Enter brand name"
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Tags</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={newTag}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === "Enter" && newTag) {
                                        e.preventDefault();
                                        addTag(newTag);
                                        setNewTag("");
                                    }
                                }}
                                placeholder="Add tag"
                            />
                            <Button
                                type="button"
                                size="icon"
                                className="bg-gray-900 text-white hover:bg-black shrink-0"
                                onClick={() => { if (newTag) { addTag(newTag); setNewTag(""); } }}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 hover:bg-gray-200">
                                        <span>{tag}</span>
                                        <X className="w-3 h-3 cursor-pointer text-gray-400 hover:text-red-500" onClick={() => removeTag(tag)} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                >
                    <span>Advanced Settings</span>
                    <span className={`transform transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}>
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                </button>

                {isAdvancedOpen && (
                    <div className="p-4 space-y-4 border-t border-gray-200">
                        <div>
                            <Label className="text-xs font-medium text-gray-700 mb-1 block">SEO Title</Label>
                            <Input
                                value={seoTitle}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeoTitle(e.target.value)}
                                placeholder="Product name - Brand"
                            />
                            <div className="text-[10px] text-gray-400 mt-1 flex justify-end">{seoTitle.length}/60</div>
                        </div>

                        <div>
                            <Label className="text-xs font-medium text-gray-700 mb-1 block">SEO Description</Label>
                            <Textarea
                                value={seoDescription}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSeoDescription(e.target.value)}
                                placeholder="Brief description for search engines"
                                rows={3}
                            />
                            <div className="text-[10px] text-gray-400 mt-1 flex justify-end">{seoDescription.length}/160</div>
                        </div>

                        <div>
                            <Label className="text-xs font-medium text-gray-700 mb-1 block">URL Slug</Label>
                            <Input
                                value={slug}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
                                placeholder="product-name"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Tip */}
            <div className="bg-gray-900 rounded-lg p-4 text-white shadow-lg">
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18h6" />
                            <path d="M10 22h4" />
                            <path d="M12 2v2" />
                            <path d="M12 14c-2.3 0-5.1-.3-7-6 0-3.3 2.7-6 6-6s6 2.7 6 6c-1.9 5.7-4.7 6-7 6z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Quick Tip</h4>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            Use descriptive titles and add relevant tags to make products easier to find in your catalog.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
