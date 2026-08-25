import { Navbar } from '@/components/navbar';
import { DrugSearchBox } from '@/components/drug-search-box';
import { Search } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tra cứu thuốc</h1>
          <p className="text-gray-500">Tìm kiếm thông tin chi tiết về thuốc</p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <DrugSearchBox placeholder="Nhập tên thuốc, hoạt chất..." className="w-full" />
        </div>

        {/* Popular searches */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Tra cứu phổ biến</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              'Paracetamol', 'Amoxicillin', 'Omeprazole', 'Metformin', 'Losartan',
              'Ibuprofen', 'Aspirin', 'Atorvastatin', 'Cetirizine', 'Vitamin C',
            ].map((name) => (
              <Link
                key={name}
                href={`/thuoc/${name.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-3 py-1.5 rounded-full bg-white border text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Tra cứu hiệu quả
            </h3>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li>• Tìm theo <strong>tên thương mại</strong> (Panadol, Augmentin...)</li>
              <li>• Tìm theo <strong>tên hoạt chất</strong> (Paracetamol, Amoxicillin...)</li>
              <li>• Gõ sai chính tả? Hệ thống vẫn tìm được nhờ fuzzy search</li>
              <li>• Thêm thuốc vào "Kiểm tra tương tác" để xem cảnh báo</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
