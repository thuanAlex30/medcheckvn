'use client';

import { notFound } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { drugsApi } from '@/lib/api-client';
import { Navbar } from '@/components/navbar';
import { ConfidenceBadge } from '@/components/drug-search-box';
import { AddToCartButton } from '@/components/interaction-matrix';
import { Pill, AlertTriangle, Info, Package, ExternalLink, Loader2, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Drug } from '@medcheck/shared-types';

interface PageProps {
  params: { slug: string };
}

export default function DrugDetailPage({ params }: PageProps) {
  const { slug } = params;

  const { data: drug, isLoading, error } = useQuery<Drug, Error>({
    queryKey: ['drug', slug],
    queryFn: () => drugsApi.getBySlug(slug) as Promise<Drug>,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !drug) {
    notFound();
  }

  const d = drug;
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Disclaimer banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          ⚠️ Thông tin dưới đây chỉ mang tính tham khảo. Không tự ý dùng thuốc — hãy tham khảo bác sĩ hoặc dược sĩ.
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{d.brandNameVi}</h1>
              <ConfidenceBadge level={d.confidenceLevel} />
                {d.prescriptionRequired ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium border border-red-200">
                    Kê đơn
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium border border-green-200">
                    Không kê đơn
                  </span>
                )}
              </div>
              {d.brandNameEn && (
                <p className="text-gray-500 text-sm mb-3">{d.brandNameEn}</p>
              )}

              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                {d.manufacturer && (
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    {d.manufacturer}
                  </span>
                )}
                <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs">
                  {d.form}
                </span>
                {d.registrationNumber && (
                  <span className="text-xs text-gray-400">
                    SĐK: {d.registrationNumber}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <AddToCartButton drug={{ id: d.id, slug: d.slug, brandNameVi: d.brandNameVi, confidenceLevel: d.confidenceLevel }} />
              <Link
                href={`/so-sanh-gia?drugId=${d.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                So sánh giá
              </Link>
            </div>
          </div>
        </div>

        {/* Active ingredients */}
        {d.activeIngredients.length > 0 && (
          <Section title="Hoạt chất">
            <div className="space-y-2">
              {d.activeIngredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Pill className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-blue-900">{ing.name}</span>
                    {ing.strength && <span className="text-blue-700 ml-2">{ing.strength}</span>}
                    {ing.rxCUI && <span className="text-xs text-blue-400 ml-2">RxCUI: {ing.rxCUI}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Usage */}
        {d.usageVi && (
          <Section title="Công dụng">
            <p className="text-gray-700 leading-relaxed">{d.usageVi}</p>
          </Section>
        )}

        {/* Dosage */}
        {d.dosageVi && (
          <Section title="Liều dùng">
            <p className="text-gray-700 leading-relaxed">{d.dosageVi}</p>
          </Section>
        )}

        {/* Contraindications */}
        {d.contraindicationsVi.length > 0 && (
          <Section title="Chống chỉ định">
            <div className="space-y-1.5">
              {d.contraindicationsVi.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-red-700 text-sm">{c}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Side effects */}
        {d.sideEffectsVi.length > 0 && (
          <Section title="Tác dụng phụ">
            <div className="space-y-2">
              {d.sideEffectsVi.map((se, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5',
                      se.frequency === 'thường gặp' && 'bg-yellow-100 text-yellow-700',
                      se.frequency === 'ít gặp' && 'bg-orange-100 text-orange-700',
                      se.frequency === 'hiếm gặp' && 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {se.frequency}
                  </span>
                  <span className="text-sm text-gray-700">{se.description}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Warnings */}
        {d.warningsForConditions.length > 0 && (
          <Section title="Cảnh báo theo bệnh nền">
            <div className="space-y-2">
              {d.warningsForConditions.map((w, i) => (
                <div key={i} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-sm text-orange-900">{w.condition}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      w.severity === 'nặng' && 'bg-red-100 text-red-700',
                      w.severity === 'trung bình' && 'bg-orange-100 text-orange-700',
                      w.severity === 'nhẹ' && 'bg-yellow-100 text-yellow-700',
                    )}>
                      {w.severity}
                    </span>
                  </div>
                  <p className="text-sm text-orange-800">{w.warningVi}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Source refs */}
        {d.sourceRefs.length > 0 && (
          <Section title="Nguồn tham khảo">
            <div className="space-y-1.5">
              {d.sourceRefs.map((ref, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600">{ref.source}</span>
                  {ref.url && (
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      Xem <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}
