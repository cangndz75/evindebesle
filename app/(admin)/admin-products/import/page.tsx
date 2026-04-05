"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

interface VariantPreview {
  color: string;
  size: string;
  stock: number;
  barcode: string;
}

interface ProductPreview {
  modelCode: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  gender: string;
  variants: VariantPreview[];
  imageCount: number;
}

interface PreviewResult {
  totalRows: number;
  totalProducts: number;
  preview: ProductPreview[];
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: { modelCode: string; error: string }[];
}

export default function ProductImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".xlsx")) {
      toast.error("Lütfen bir Excel dosyası (.xlsx) seçin");
      return;
    }
    setFile(f);
    setPreviewData(null);
    setImportResult(null);
    setPreviewing(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin-products/import", { method: "PUT", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview hatası");
      setPreviewData(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPreviewing(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin-products/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import hatası");
      setImportResult(data);
      toast.success(`Import tamamlandı: ${data.created} oluşturuldu, ${data.updated} güncellendi`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-7 h-7 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Excel ile Ürün Import</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Trendyol formatındaki Excel dosyasını yükleyin, ürünler otomatik oluşturulsun
          </p>
        </div>
      </div>

      {/* Bilgi kutusu */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Desteklenen Format</p>
        <p>• Trendyol ürün listesi formatı (.xlsx)</p>
        <p>• Aynı Model Koduna sahip satırlar tek ürün olarak gruplandırılır</p>
        <p>• Daha önce import edilmiş ürünler (aynı stok kodu) güncellenir</p>
      </div>

      {/* Dosya Yükleme Alanı */}
      {!file && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
          }`}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700">Excel dosyasını buraya sürükleyin</p>
          <p className="text-sm text-gray-500 mt-1">veya tıklayın ve seçin</p>
          <p className="text-xs text-gray-400 mt-3">.xlsx</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* Dosya seçildi */}
      {file && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button onClick={reset} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Preview yükleniyor */}
      {previewing && (
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Excel dosyası analiz ediliyor...</span>
        </div>
      )}

      {/* Preview Sonuçları */}
      {previewData && !importResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{previewData.totalRows}</p>
              <p className="text-sm text-gray-500 mt-1">Toplam Satır</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{previewData.totalProducts}</p>
              <p className="text-sm text-gray-500 mt-1">Benzersiz Ürün</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {previewData.preview.reduce((a, p) => a + p.variants.length, 0)}+
              </p>
              <p className="text-sm text-gray-500 mt-1">Varyant (ilk 30)</p>
            </div>
          </div>

          {/* Preview Tablo */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Ürün Önizlemesi
                <span className="text-xs text-gray-400 font-normal ml-2">(ilk 30 ürün)</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Model Kodu</th>
                    <th className="px-4 py-3 text-left">Ürün Adı</th>
                    <th className="px-4 py-3 text-left">Marka</th>
                    <th className="px-4 py-3 text-left">Kategori</th>
                    <th className="px-4 py-3 text-right">Fiyat</th>
                    <th className="px-4 py-3 text-center">Cinsiyet</th>
                    <th className="px-4 py-3 text-center">Varyant</th>
                    <th className="px-4 py-3 text-center">Görsel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewData.preview.map((p) => (
                    <tr key={p.modelCode} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.modelCode}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{p.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.brand || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category || "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {p.price > 0 ? `₺${p.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          p.gender === "FEMALE" ? "bg-pink-100 text-pink-700" :
                          p.gender === "MALE" ? "bg-blue-100 text-blue-700" :
                          p.gender === "UNISEX" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {p.gender === "FEMALE" ? "Kadın" : p.gender === "MALE" ? "Erkek" : p.gender === "UNISEX" ? "Unisex" : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                          {p.variants.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          p.imageCount > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}>
                          {p.imageCount > 0 ? `${p.imageCount} görsel` : "Yok"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Butonu */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Package className="w-5 h-5" />
              )}
              {importing ? "Import ediliyor..." : `${previewData.totalProducts} Ürünü Import Et`}
            </button>
            <button
              onClick={reset}
              disabled={importing}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Import Sonuç */}
      {importResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-700">{importResult.created}</p>
              <p className="text-sm text-green-600 mt-1">Oluşturuldu</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-700">{importResult.updated}</p>
              <p className="text-sm text-blue-600 mt-1">Güncellendi</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <X className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-600">{importResult.skipped}</p>
              <p className="text-sm text-gray-500 mt-1">Atlandı</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-600">{importResult.errors.length}</p>
              <p className="text-sm text-red-500 mt-1">Hata</p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-800 mb-2">Hatalar</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {importResult.errors.map((e, i) => (
                  <p key={i} className="text-sm text-red-700">
                    <span className="font-mono font-medium">{e.modelCode}</span>: {e.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <a
              href="/admin-products"
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              <Package className="w-5 h-5" />
              Ürün Listesine Git
            </a>
            <button
              onClick={reset}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Yeni Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
