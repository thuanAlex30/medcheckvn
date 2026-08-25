'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/store/auth-store';
import { Navbar } from '@/components/navbar';
import { Package, Plus, Trash2, Clock, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MedicationScheduleEntry } from '@medcheck/shared-types';
import { useState } from 'react';

export default function MedicineCabinetPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      router.push('/dang-nhap');
    }
  }, [accessToken, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: () => userApi.getSchedule(),
    enabled: Boolean(accessToken),
  });

  const addMutation = useMutation({
    mutationFn: (entry: Omit<MedicationScheduleEntry, 'id'>) => userApi.addToSchedule(entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => userApi.removeFromSchedule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  });

  const consentMutation = useMutation({
    mutationFn: () => userApi.consent(),
  });

  if (!accessToken) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tủ thuốc cá nhân</h1>
            <p className="text-gray-500 mt-1">
              Xin chào, {user?.name ?? user?.email ?? 'bạn'}
            </p>
          </div>
          <button
            onClick={() => addMutation.mutate({
              drugId: 'demo',
              drugName: 'Paracetamol 500mg',
              dosage: '1 viên',
              times: ['08:00', '20:00'],
              startDate: new Date().toISOString(),
            })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm thuốc
          </button>
        </div>

        {/* Consent */}
        {!user?.consentGivenAt && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 mb-3">
              Để lưu thông tin sức khỏe của bạn (bệnh nền, lịch uống thuốc), vui lòng đồng ý với
              chính sách bảo vệ dữ liệu cá nhân.
            </p>
            <button
              onClick={() => consentMutation.mutate()}
              disabled={consentMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              Đồng ý &amp; Tiếp tục
            </button>
          </div>
        )}

        {/* Schedule */}
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-gray-900">Lịch uống thuốc</h2>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && (!data?.schedule || data.schedule.length === 0) && (
            <div className="text-center py-10">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-1">Chưa có thuốc nào trong tủ thuốc</p>
              <p className="text-sm text-gray-400">
                Thêm thuốc bạn đang dùng để nhận lời nhắc
              </p>
            </div>
          )}

          {!isLoading && data?.schedule && data.schedule.length > 0 && (
            <div className="space-y-3">
              {data.schedule.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{entry.drugName}</p>
                    <p className="text-sm text-gray-500">{entry.dosage}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {entry.times.join(', ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => entry.id && removeMutation.mutate(entry.id)}
                    disabled={removeMutation.isPending}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-2xl border p-5">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Nhắc nhở uống thuốc</h3>
            <p className="text-sm text-gray-500">Nhận thông báo khi đến giờ uống thuốc</p>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Theo dõi bệnh nền</h3>
            <p className="text-sm text-gray-500">Cảnh báo tương tác theo bệnh nền của bạn</p>
          </div>
        </div>
      </main>
    </div>
  );
}

