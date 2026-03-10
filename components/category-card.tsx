import Link from 'next/link';
import { Category } from '@/lib/types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/products?category=${category.id}`}>
      <div className="group flex items-center gap-4 bg-card border border-border/60 rounded-xl p-4 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 hover:border-primary/25 transition-all duration-300 cursor-pointer">
        {/* Icon */}
        <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl flex items-center justify-center group-hover:from-primary/25 group-hover:to-accent/25 transition-colors duration-300">
          <span className="text-2xl">{category.icon}</span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}
