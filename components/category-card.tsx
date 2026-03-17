import Link from 'next/link';
import { Category } from '@/lib/types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/products?category=${category.id}`}>
      <div className="group flex flex-col items-center gap-2.5 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          <span className="text-2xl">{category.icon}</span>
        </div>
        <h3 className="text-xs font-semibold text-slate-700 text-center leading-tight group-hover:text-blue-600 transition-colors">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}
