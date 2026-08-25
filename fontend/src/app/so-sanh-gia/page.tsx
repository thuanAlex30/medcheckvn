'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/navbar';
import { DrugSearchBox } from '@/components/drug-search-box';
import { drugsApi } from '@/lib/api-client';
import { ConfidenceBadge } from '@/components/drug-search-box';
import { DollarSign, TrendingDown, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PriceComparisonPage() {
  const searchParams = useSearchParams();
  const initialDrugId = searchParams.get('drugId') ?? '';
  const [selectedId, setSelectedId] = useState<string | null>(initialDrugId);

  const { data: prices, isLoading: loadingPrices } = useQuery({
    queryKey: ['prices', selectedId],
    queryFn: () => drugsApi.getPrices(selectedId!),
    enabled: Boolean(selectedId),
  });

  const { data: alternatives, isLoading: loadingAlts } = useQuery({
    queryKey: ['alternatives', selectedId],
    queryFn: () => drugsApi.getAlternativesWithPrices(selectedId!),
    enabled: Boolean(selectedId),
  });

  const handleSelect = (slug: string) => {
    // Navigate to drug detail first to get the id, then set it
    // Simple approach: store slug and resolve
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/drugs/${encodeURIComponent(slug)}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d._id) setSelectedId(d._id);
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">So sánh giá thuốc</h1>
          <p className="text-gray-500">Tìm giá tốt nhất từ các nhà thuốc uy tín</p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <DrugSearchBox
            placeholder="Tìm thuốc để so sánh giá..."
            onSelect={handleSelect}
            className="w-full"
          />
        </div>

        {selectedId && (
          <>
            {/* Prices */}
            <div className="bg-white rounded-2xl border p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Bảng giá theo nhà thuốc
              </h2>

              {loadingPrices && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loadingPrices && prices?.prices && prices.prices.length === 0 && (
                <p className="text-center text-gray-400 py-6">Chưa có dữ liệu giá cho thuốc này.</p>
              )}

              {!loadingPrices && prices?.prices && prices.prices.length > 0 && (
                <div className="space-y-2">
                  {prices.prices.map((p, i) => (
                    <div
                      key={p.id}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-xl border',
                        i === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {i === 0 && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">GIÁ TỐT NHẤT</span>}
                        <span className="font-medium">{p.pharmacySource}</span>
                        {p.unit && <span className="text-sm text-gray-400">{p.unit}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                        </span>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="ml-3 text-primary hover:underline text-sm flex items-center gap-1">
                            Mua <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alternatives */}
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                Gợi ý thuốc gốc thay thế (tiết kiệm ≥15%)
              </h2>

              {loadingAlts && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loadingAlts && (!alternatives?.alternatives || alternatives.alternatives.length === 0) && (
                <p className="text-center text-gray-400 py-6">
                  Không có thuốc gốc rẻ hơn trong cơ sở dữ liệu hoặc mức tiết kiệm dưới 15%.
                </p>
              )}

              {!loadingAlts && alternatives?.alternatives && alternatives.alternatives.length > 0 && (
                <div className="space-y-3">
                  {alternatives.alternatives.map((alt) => (
                    <div key={alt.drug.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{alt.drug.brandNameVi}</span>
                            <ConfidenceBadge level={alt.drug.confidenceLevel} />
                          </div>
                          <p className="text-sm text-gray-500">{alt.drug.activeIngredients.join(', ')}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        {alt.cheapestPrice && (
                          <span className="text-lg font-bold text-blue-700">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(alt.cheapestPrice)}
                          </span>
                        )}
                        {alt.savingsPercent > 0 && (
                          <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            -{alt.savingsPercent}%
                          </span>
                        )}
                        <Link
                          href={`/thuoc/${alt.drug.slug}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Xem
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedId && (
          <div className="text-center text-gray-400 py-16">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Chọn thuốc để xem so sánh giá</p>
          </div>
        )}
      </main>
    </div>
  );
}
