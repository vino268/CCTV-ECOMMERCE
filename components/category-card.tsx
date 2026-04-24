"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Category } from '@/lib/types';
import { getSafeImageSrc } from '@/lib/product-image';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const categoryImage = getSafeImageSrc(category.image, '/images/camera.jpg');

  return (
    <Link
      href={`/products?category=${category.id}`}
      className="group block relative overflow-hidden rounded-2xl shadow-md hover:shadow-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative w-full aspect-[4/3]">
        {!hasImageError ? (
          <Image
            src={categoryImage}
            alt={category.name}
            fill
            unoptimized
            onError={() => setHasImageError(true)}
            className="object-cover group-hover:scale-110 transition duration-500"
          />
        ) : (
          <Image src="/images/camera.jpg" alt={category.name} fill className="object-cover" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 group-hover:from-black/70 transition-all duration-300" />
        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/15 transition-colors duration-300" />

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <h3 className="text-white text-lg font-semibold drop-shadow-sm">{category.name}</h3>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
