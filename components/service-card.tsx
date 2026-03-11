import { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 transition-all duration-200">
      {/* Icon container */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
        {service.icon}
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-gray-900 mb-2">{service.name}</h3>
      <p className="text-sm text-gray-500 leading-relaxed flex-1">{service.description}</p>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        {service.price ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Starting from
              </p>
              <p className="text-base font-bold text-blue-600">${service.price}</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              Learn More <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button size="sm" className="w-full gap-1.5">
            Get a Quote <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
