'use client';

import { useQuery } from '@tanstack/react-query';
import { interactionsApi } from '@/lib/api-client';
import { useInteractionCart } from '@/lib/store/interaction-cart';
import { cn } from '@/lib/utils';
import type { InteractionCheckResponse, Severity } from '@medcheck/shared-types';
import { AlertTriangle, ShieldCheck, Info, X, Loader2, Plus } from 'lucide-react';

interface InteractionMatrixProps {
  drugIds: string[];
  onRemoveDrug?: (id: string) => void;
}

export function InteractionMatrix({ drugIds, onRemoveDrug }: InteractionMatrixProps) {
  const { data, isLoading, error } = useQuery<InteractionCheckResponse, Error>({
    queryKey: ['interactions', drugIds.sort()],
    queryFn: () => interactionsApi.check(drugIds),
    enabled: drugIds.length >= 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Đang kiểm tra tương tác...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        Lỗi kiểm tra tương tác: {error.message}
      </div>
    );
  }

  if (!data) return null;

  const { pairs, personalizedWarnings } = data;

  if (pairs.length === 0 && personalizedWarnings.length === 0) {
    return (
      <div className="flex items-center gap-3 p-6 bg-green-50 border border-green-200 rounded-xl">
        <ShieldCheck className="w-8 h-8 text-green-600 shrink-0" />
        <div>
          <p className="font-semibold text-green-800">Không phát hiện tương tác</p>
          <p className="text-sm text-green-700 mt-0.5">
            Các thuốc đã chọn chưa có tương tác được ghi nhận trong cơ sở dữ liệu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Interaction pairs */}
      {pairs.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Tương tác thuốc được phát hiện
          </h3>
          {pairs.map((pair, i) => (
            <InteractionCard key={i} pair={pair} />
          ))}
        </div>
      )}

      {/* Personalized warnings */}
      {personalizedWarnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Cảnh báo theo bệnh nền của bạn
          </h3>
          {personalizedWarnings.map((w, i) => (
            <WarningCard key={i} warning={w} />
          ))}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}

function InteractionCard({ pair }: { pair: InteractionCheckResponse['pairs'][0] }) {
  const severityConfig = {
    nặng: { color: 'bg-red-50 border-red-300', icon: AlertTriangle, iconColor: 'text-red-600', badge: 'bg-red-100 text-red-700' },
    'trung bình': { color: 'bg-orange-50 border-orange-300', icon: AlertTriangle, iconColor: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
    nhẹ: { color: 'bg-yellow-50 border-yellow-300', icon: Info, iconColor: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  }[pair.severity]!;

  const Icon = severityConfig.icon;

  return (
    <div className={cn('border rounded-xl p-4', severityConfig.color)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', severityConfig.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{pair.drugAName}</span>
            <span className="text-muted-foreground text-sm">↔</span>
            <span className="font-semibold text-sm">{pair.drugBName}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', severityConfig.badge)}>
              {pair.severity.toUpperCase()}
            </span>
          </div>
          <p className="text-sm mt-1 text-gray-700">{pair.descriptionVi}</p>
          {pair.mechanismVi && (
            <p className="text-xs mt-1 text-gray-500 italic">Cơ chế: {pair.mechanismVi}</p>
          )}
          {pair.recommendationVi && (
            <p className="text-sm mt-2 font-medium text-gray-800 flex gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
              {pair.recommendationVi}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WarningCard({ warning }: { warning: InteractionCheckResponse['personalizedWarnings'][0] }) {
  return (
    <div className="border border-orange-200 bg-orange-50 rounded-xl p-4">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{warning.drugName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
              {warning.severity.toUpperCase()} — {warning.condition}
            </span>
          </div>
          <p className="text-sm mt-1 text-gray-700">{warning.warningVi}</p>
        </div>
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        ⚠️ Thông tin tương tác thuốc được tổng hợp từ các nguồn đã kiểm chứng nhưng không thay thế
        tư vấn của bác sĩ hoặc dược sĩ. Luôn tham khảu ý kiến chuyên môn trước khi thay đổi thuốc.
        Nguồn tham khảo: DDInter, DrugBank.
      </p>
    </div>
  );
}

// ── Cart chip component ─────────────────────────────────────────────────────

export function InteractionCartPanel() {
  const { items, removeDrug, clearAll } = useInteractionCart();
  const { data } = useQuery<InteractionCheckResponse, Error>({
    queryKey: ['interactions', items.map((i) => i.drug.id).sort()],
    queryFn: () => interactionsApi.check(items.map((i) => i.drug.id)),
    enabled: items.length >= 2,
  });

  const hasInteractions = (data?.pairs.length ?? 0) > 0 || (data?.personalizedWarnings.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">
          Thuốc đã chọn ({items.length})
        </h2>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.drug.id}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border',
              hasInteractions
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-primary/5 border-primary/20 text-primary',
            )}
          >
            <span className="truncate max-w-32">{item.drug.brandNameVi}</span>
            <button
              onClick={() => removeDrug(item.drug.id)}
              className="hover:text-red-600 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            Chưa chọn thuốc nào. Thêm thuốc để kiểm tra tương tác.
          </p>
        )}
      </div>

      {items.length >= 2 && <InteractionMatrix drugIds={items.map((i) => i.drug.id)} />}
    </div>
  );
}

export function AddToCartButton({ drug }: { drug: { id: string; slug: string; brandNameVi: string; confidenceLevel: 'xanh' | 'vang' | 'xam' } }) {
  const { addDrug, isInCart } = useInteractionCart();
  const inCart = isInCart(drug.id);

  return (
    <button
      onClick={() => addDrug(drug as import('@medcheck/shared-types').DrugSearchHit)}
      disabled={inCart}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        inCart
          ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
          : 'bg-primary text-white hover:bg-primary/90',
      )}
    >
      <Plus className="w-4 h-4" />
      {inCart ? 'Đã thêm vào kiểm tra' : 'Kiểm tra tương tác'}
    </button>
  );
}
