'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ocrApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/store/auth-store';
import { Navbar } from '@/components/navbar';
import { FileText, Upload, Check, AlertTriangle, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function OcrPrescriptionPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const ocrMutation = useMutation({
    mutationFn: (f: File) => ocrApi.uploadPrescription(f),
    onSuccess: (data) => {
      // redirect to interaction page with detected drug IDs
      const ids = data.detectedLines
        .filter((l) => l.matchedDrugId)
        .map((l) => l.matchedDrugId as string);
      if (ids.length > 0) {
        // Store in sessionStorage for now
        sessionStorage.setItem('ocr-detected-ids', JSON.stringify(ids));
        router.push('/tuong-tac');
      }
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(f);
      const input = document.getElementById('file-input') as HTMLInputElement;
      if (input) {
        input.files = dt.files;
        setFile(f);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(f);
      }
    }
  }, []);

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-24 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cần đăng nhập</h1>
          <p className="text-gray-500 mb-6">Vui lòng đăng nhập để sử dụng tính năng OCR đơn thuốc.</p>
          <Link href="/dang-nhap" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors inline-block">
            Đăng nhập
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đọc đơn thuốc</h1>
          <p className="text-gray-500">
            Upload ảnh đơn thuốc — AI sẽ tự động nhận diện tên thuốc
          </p>
        </div>

        <div className="bg-white rounded-2xl border p-6 mb-6">
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
              preview ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50',
            )}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow" />
                <button
                  onClick={() => { setPreview(null); setFile(null); }}
                  className="text-sm text-red-500 hover:underline"
                >
                  Chọn ảnh khác
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">Kéo thả ảnh hoặc nhấn để chọn</p>
                  <p className="text-sm text-gray-400 mt-1">Hỗ trợ JPG, PNG, WEBP (tối đa 10MB)</p>
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Chọn ảnh
                </button>
              </div>
            )}
          </div>

          {file && (
            <button
              onClick={() => ocrMutation.mutate(file)}
              disabled={ocrMutation.isPending}
              className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {ocrMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý OCR...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Nhận diện đơn thuốc
                </>
              )}
            </button>
          )}
        </div>

        {ocrMutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
            Lỗi OCR: {ocrMutation.error instanceof Error ? ocrMutation.error.message : 'Upload thất bại'}
          </div>
        )}

        {ocrMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            <Check className="w-5 h-5 inline mr-2 text-green-600" />
            Nhận diện thành công! Đang chuyển sang kiểm tra tương tác...
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Mẹo để nhận diện chính xác
          </h3>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li>• Chụp ảnh rõ nét, đủ ánh sáng</li>
            <li>• Đảm bảo nội dung đơn thuốc không bị che khuất</li>
            <li>• Ưu tiên ảnh scan thay vì chụp màn hình</li>
            <li>• Kết quả cần được xác nhận thủ công trước khi sử dụng</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
