'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Chỗ này có thể wire Sentry/Browser reporting sau
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-destructive">!</p>
      <h1 className="mt-4 text-2xl font-semibold">Đã xảy ra lỗi</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ứng dụng gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-muted-foreground">Mã lỗi: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
