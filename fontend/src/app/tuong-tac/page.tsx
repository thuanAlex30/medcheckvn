'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/navbar';
import { DrugSearchBox } from '@/components/drug-search-box';
import { InteractionCartPanel } from '@/components/interaction-matrix';
import { GitCompare, Loader2 } from 'lucide-react';
import { drugsApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export default function InteractionPage() {
  const [searchResults, setSearchResults] = useState<{ id: string; slug: string; brandNameVi: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (slug: string) => {
    setIsSearching(true);
    try {
      const data = await drugsApi.getBySlug(slug) as { _id?: string; slug?: string; brandNameVi?: string };
      if (data?._id) {
        setSearchResults((prev) => {
          if (prev.some((d) => d.id === data._id)) return prev;
          return [...prev, { id: data._id!, slug: data.slug!, brandNameVi: data.brandNameVi! }];
        });
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kiểm tra tương tác thuốc</h1>
          <p className="text-gray-500">
            Thêm từ 2 thuốc trở lên để kiểm tra tương tác nguy hiểm
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <DrugSearchBox
              placeholder="Tìm thuốc để thêm vào kiểm tra..."
              onSelect={handleSearch}
              className="w-full"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: drug list */}
          <div className="bg-white rounded-2xl border p-6 h-fit">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary" />
              Thuốc đã chọn
            </h2>
            <InteractionCartPanel />
          </div>

          {/* Right: instructions */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Hướng dẫn sử dụng</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Tìm và thêm thuốc bạn đang dùng vào danh sách bên trái</li>
                <li>Thêm tối thiểu 2 thuốc để kiểm tra</li>
                <li>Hệ thống sẽ tự động phân tích tương tác giữa các thuốc</li>
                <li>Xem cảnh báo về mức độ nghiêm trọng và khuyến nghị</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-700 mb-3">Biểu tượng mức độ nghiêm trọng</h3>
              <div className="space-y-2">
                {[
                  { level: 'nặng', color: 'bg-red-100 border-red-300', text: 'Không nên dùng đồng thời, cần hỏi ý kiến bác sĩ ngay' },
                  { level: 'trung bình', color: 'bg-orange-100 border-orange-300', text: 'Cần thận trọng, theo dõi khi dùng chung' },
                  { level: 'nhẹ', color: 'bg-yellow-100 border-yellow-300', text: 'Có thể dùng, nhưng cần lưu ý' },
                ].map(({ level, color, text }) => (
                  <div key={level} className={cn('border rounded-lg p-3', color)}>
                    <p className="font-semibold text-sm capitalize mb-0.5">{level}</p>
                    <p className="text-xs opacity-80">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>⚠️ Lưu ý:</strong> Tương tác thuốc được tổng hợp từ cơ sở dữ liệu tham khảo.
              Không thay thế tư vấn bác sĩ. Luôn khai báo đầy đủ thuốc đang dùng cho bác sĩ.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
