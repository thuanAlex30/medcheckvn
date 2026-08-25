'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { drugsApi } from '@/lib/api-client';
import { Search, X, Pill, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrugSearchBoxProps {
  placeholder?: string;
  onSelect?: (slug: string) => void;
  className?: string;
}

export function DrugSearchBox({ placeholder = 'Tìm thuốc...', onSelect, className }: DrugSearchBoxProps) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['drugs', 'search', q],
    queryFn: () => drugsApi.search(q, 8),
    enabled: q.length >= 2,
    staleTime: 30_000,
  });

  const results = data?.results ?? [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback(
    (slug: string) => {
      setQ('');
      setOpen(false);
      onSelect?.(slug);
    },
    [onSelect],
  );

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            placeholder:text-muted-foreground transition-colors"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && q.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in">
          {isFetching && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tìm...
            </div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Không tìm thấy kết quả</div>
          )}
          {!isFetching && results.map((drug) => (
            <button
              key={drug.id}
              onClick={() => handleSelect(drug.slug)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
            >
              <Pill className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 truncate">{drug.brandNameVi}</span>
              <ConfidenceBadge level={drug.confidenceLevel} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConfidenceBadge({ level }: { level: 'xanh' | 'vang' | 'xam' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
        level === 'xanh' && 'bg-green-100 text-green-700',
        level === 'vang' && 'bg-yellow-100 text-yellow-700',
        level === 'xam' && 'bg-gray-100 text-gray-500',
      )}
    >
      {level === 'xanh' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {level === 'xanh' ? 'Đã kiểm chứng' : level === 'vang' ? 'Cần xác minh' : 'Chưa xác minh'}
    </span>
  );
}
