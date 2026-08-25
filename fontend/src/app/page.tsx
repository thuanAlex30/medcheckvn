import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { HomeSearch } from '@/components/home-search';
import { Search, GitCompare, DollarSign, Shield } from 'lucide-react';

const FEATURES = [
  {
    href: '/thuoc',
    icon: Search,
    title: 'Tra cứu thuốc',
    desc: 'Tìm kiếm thông tin chi tiết về hơn 30,000 thuốc được phép lưu hành tại Việt Nam',
    color: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    href: '/tuong-tac',
    icon: GitCompare,
    title: 'Kiểm tra tương tác',
    desc: 'Phát hiện tương tác nguy hiểm giữa các thuốc bạn đang dùng',
    color: 'bg-red-50 border-red-100',
    iconColor: 'text-red-600',
  },
  {
    href: '/so-sanh-gia',
    icon: DollarSign,
    title: 'So sánh giá',
    desc: 'So sánh giá thuốc từ các nhà thuốc uy tín, tìm thuốc gốc giá rẻ hơn',
    color: 'bg-green-50 border-green-100',
    iconColor: 'text-green-600',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-16 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Dữ liệu thuốc đã kiểm chứng
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Tra cứu thuốc<br />
            <span className="text-primary">nhanh &amp; an toàn</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Thông tin thuốc chính xác, kiểm tra tương tác thuốc, so sánh giá và quản lý tủ thuốc cá nhân — tất cả trong một nền tảng.
          </p>
        </div>

        <HomeSearch />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`${card.color} border rounded-2xl p-6 hover:shadow-md transition-shadow group`}
              >
                <Icon className={`w-8 h-8 ${card.iconColor} mb-4`} />
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>⚠️ Lưu ý quan trọng:</strong> MedCheck VN cung cấp thông tin tham khảo, không thay thế tư vấn
            của bác sĩ hoặc dược sĩ. Luôn tham khảo ý kiến chuyên môn trước khi dùng thuốc, đặc biệt khi bạn đang
            dùng nhiều loại thuốc cùng lúc hoặc có bệnh nền.
          </p>
        </div>
      </main>

      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 MedCheck VN — Thông tin y khoa chỉ mang tính tham khảo
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/thuoc" className="hover:text-primary transition-colors">Tra cứu thuốc</Link>
            <Link href="/tuong-tac" className="hover:text-primary transition-colors">Tương tác thuốc</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}