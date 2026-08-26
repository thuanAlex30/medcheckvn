'use client';

import { useState } from 'react';

/**
 * Disclaimer pháp lý — Phần 13.2 của spec: "Mọi trang có thông tin thuốc phải render
 * banner disclaimer pháp lý, không được ẩn trong footer nhỏ."
 *
 * Component này có thể được thu gọn/mở rộng — collapsed mặc định để không chiếm diện
 * tích nhưng luôn hiển thị.
 */
export function Disclaimer({ variant = 'info' }: { variant?: 'info' | 'warning' }) {
  const [open, setOpen] = useState(false);
  const tone =
    variant === 'warning'
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : 'border-blue-300 bg-blue-50 text-blue-900';

  return (
    <aside
      role="note"
      aria-label="Tuyên bố miễn trừ trách nhiệm y khoa"
      className={`my-4 rounded-lg border ${tone} p-3 text-sm`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <span>Lưu ý y khoa &amp; miễn trừ trách nhiệm</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>
            Thông tin trên MedCheck VN chỉ mang tính chất <strong>tham khảo</strong>, không thay thế
            chỉ định của bác sĩ hoặc dược sĩ.
          </p>
          <p>
            Luôn đọc kỹ tờ hướng dẫn sử dụng đi kèm sản phẩm và tham vấn chuyên gia y tế trước khi
            dùng thuốc, đặc biệt khi đang mang thai, cho con bú, có bệnh nền hoặc đang dùng thuốc
            khác.
          </p>
          <p>
            Các cảnh báo tương tác thuốc được tổng hợp từ các nguồn dược thư quốc tế và có thể không
            bao quát toàn bộ. Người dùng tự chịu trách nhiệm về quyết định sử dụng thuốc.
          </p>
        </div>
      )}
    </aside>
  );
}
