'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { DrugSearchBox } from '@/components/drug-search-box';

const SUGGESTIONS = ['Paracetamol', 'Amoxicillin', 'Omeprazole', 'Metformin', 'Losartan'];

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export function HomeSearch() {
  const router = useRouter();

  const goToDrug = useCallback(
    (slug: string) => {
      router.push(`/thuoc/${slug}`);
    },
    [router],
  );

  return (
    <div className="max-w-2xl mx-auto mb-16">
      <DrugSearchBox
        placeholder="Nhập tên thuốc để tra cứu..."
        onSelect={goToDrug}
        className="w-full"
      />
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => goToDrug(toSlug(suggestion))}
            className="text-xs px-3 py-1 rounded-full bg-white border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}