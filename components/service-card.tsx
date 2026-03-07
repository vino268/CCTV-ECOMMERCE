import { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
      {/* Icon */}
      <div className="text-4xl mb-4">{service.icon}</div>

      {/* Content */}
      <h3 className="font-semibold text-lg text-foreground mb-2">{service.name}</h3>
      <p className="text-muted-foreground text-sm mb-4">{service.description}</p>

      {/* Price and Button */}
      {service.price && (
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            From ${service.price}
          </span>
          <Button size="sm" variant="outline">
            Learn More
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
