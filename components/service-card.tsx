import Link from 'next/link';
import { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
      {/* Icon */}
      <div className="text-4xl mb-4">{service.icon}</div>

      {/* Content */}
      <h3 className="font-semibold text-base text-slate-900 mb-1.5">{service.name}</h3>
      <p className="text-slate-500 text-sm mb-4 leading-relaxed">{service.description}</p>

      {/* Price and Button */}
      {service.price && (
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            From {service.price}
          </span>
          <Button size="sm" variant="outline" asChild className="transition-colors hover:bg-gray-100">
            <Link href="/services">Learn More</Link>
          </Button>
        </div>
      )}
      {!service.price && (
        <Button className="w-full" size="sm">
          Contact Us
        </Button>
      )}
    </div>
  );
}
