import Link from 'next/link';
import { Category } from '@/lib/types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/products?category=${category.id}`}>
      <div className="group relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
        {/* Background */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors">
          <span className="text-5xl">{category.icon}</span>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center pb-4">
          <h3 className="text-white font-semibold text-center opacity-0 group-hover:opacity-100 transition-opacity">
            {category.name}
          </h3>
        </div>

        {/* Text at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-4 group-hover:from-black/50">
          <p className="text-white font-medium text-sm">{category.name}</p>
        </div>
      </div>
    </Link>
  );
}
