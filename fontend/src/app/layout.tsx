import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Disclaimer } from '@/components/disclaimer';

export const metadata: Metadata = {
  title: {
    default: 'MedCheck VN — Tra cứu thuốc, tương tác & giá thông minh',
    template: '%s | MedCheck VN',
  },
  description:
    'Tra cứu thông tin thuốc, kiểm tra tương tác thuốc, so sánh giá và quản lý tủ thuốc cá nhân.',
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💊</text></svg>",
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-background antialiased">
        <Providers>
          <div className="mx-auto max-w-3xl px-4 pb-12 pt-4">
            <Disclaimer />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
