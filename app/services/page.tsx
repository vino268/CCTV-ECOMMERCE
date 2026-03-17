'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  MessageCircle,
  Wrench,
  Phone,
  ClipboardList,
  PenTool,
  Settings,
  Headphones,
  PhoneCall,
  ChevronUp,
  Monitor,
  Clock,
  ShieldCheck,
  Cpu,
  MapPin,
  AlertTriangle,
  Wifi,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */

interface Service {
  _id: string;
  slug?: string;
  name: string;
  description: string;
  price?: number;
  icon?: string;
}

/* ------------------------------------------------------------------ */
/*  STATIC DATA                                                       */
/* ------------------------------------------------------------------ */

const processSteps = [
  {
    icon: <ClipboardList className="w-6 h-6" />,
    title: 'Consultation',
    desc: 'Free assessment of your security needs',
  },
  {
    icon: <PenTool className="w-6 h-6" />,
    title: 'Design',
    desc: 'Custom CCTV system planning',
  },
  {
    icon: <Settings className="w-6 h-6" />,
    title: 'Installation',
    desc: 'Professional installation and testing',
  },
  {
    icon: <Headphones className="w-6 h-6" />,
    title: 'Support',
    desc: 'Maintenance and technical support',
  },
];

const testimonials = [
  {
    name: 'John Smith',
    role: 'Store Manager',
    text: 'TN Automation installed a 16-camera system at our retail store. The image quality is incredible and their team was extremely professional throughout the process.',
  },
  {
    name: 'Sarah Johnson',
    role: 'Homeowner',
    text: 'From consultation to installation, everything was seamless. I can monitor my entire property from my phone now. I feel much safer with their system.',
  },
  {
    name: 'Mike Davis',
    role: 'Business Owner',
    text: 'Best security solution provider in Nashville. Quick response time, reliable equipment, and their maintenance plan gives us complete peace of mind.',
  },
];

/* service-slug → rich details used by the expanded panel */
const serviceDetails: Record<
  string,
  {
    details: string;
    equipment: string[];
    installTime: string;
    warranty: string;
  }
> = {
  'online-support': {
    details:
      'Our remote support team provides real-time CCTV troubleshooting, firmware updates, app configuration, and network diagnostics — all from the comfort of your location without the need for an on-site visit.',
    equipment: [
      'Remote Desktop Tools',
      'Network Diagnostic Suites',
      'Firmware Update Systems',
      'Mobile App Config Tools',
    ],
    installTime: 'Instant remote session (30-60 min)',
    warranty: '7-day follow-up support included',
  },
  'installation-support': {
    details:
      'Our certified technicians handle the complete CCTV installation process — from camera placement and cable routing to DVR/NVR setup, mobile app pairing, and final system testing to ensure flawless operation.',
    equipment: [
      'Thermal Imaging Scanners',
      'Site Mapping Tools',
      'Cable Testing Equipment',
      'Network Analysis Tools',
    ],
    installTime: 'Same-day or next-day (2-6 hours)',
    warranty: '1-year installation warranty',
  },
  'service-maintenance': {
    details:
      'Keep your security system in peak condition with scheduled maintenance, camera cleaning, firmware updates, hard-drive health checks, and quick repairs by our experienced field engineers.',
    equipment: [
      'Lens Cleaning Kits',
      'HDD Diagnostic Tools',
      'Signal Strength Meters',
      'Replacement Component Stock',
    ],
    installTime: 'Scheduled visit (1-3 hours)',
    warranty: '30-day post-service guarantee',
  },
};

const defaultDetails = {
  details:
    'Our security experts conduct a thorough assessment of your property to identify vulnerabilities and recommend the ideal camera types, placement, and recording solutions tailored to your budget and security goals.',
  equipment: [
    'Thermal Imaging Scanners',
    'Site Mapping Tools',
    'Risk Assessment Software',
    'Network Analysis Equipment',
  ],
  installTime: 'Same-day consultation (1-2 hours)',
  warranty: 'Free follow-up consultation within 30 days',
};

const serviceIconMap: Record<string, React.ReactNode> = {
  support: <Headphones className="w-7 h-7" />,
  installation: <Settings className="w-7 h-7" />,
  maintenance: <Wrench className="w-7 h-7" />,
};

/* ------------------------------------------------------------------ */
/*  PAGE COMPONENT                                                    */
/* ------------------------------------------------------------------ */

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const getDetails = (service: Service) =>
    serviceDetails[service.slug || ''] ?? defaultDetails;

  const whatsappLink =
    'https://wa.me/918778500296?text=Hello%20TN%20Automation%2C%20I%20would%20like%20to%20know%20more%20about%20your%20CCTV%20services.';

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Our Services
          </h1>
          <p className="text-muted-foreground">
            Professional security solutions and support from our expert team
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ====== Services Grid ====== */}
        <div className="mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-8 animate-pulse"
                >
                  <div className="w-14 h-14 bg-muted rounded-xl mb-5" />
                  <div className="h-5 bg-muted rounded w-2/3 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-4/5 mb-5" />
                  <div className="h-4 bg-muted rounded w-1/3 mb-5" />
                  <div className="h-9 bg-muted rounded w-28" />
                </div>
              ))
            ) : services.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-muted-foreground">
                No services available at the moment. Please check back soon.
              </div>
            ) : (
              services.map((service) => {
                const isExpanded = expandedId === service._id;
                return (
                  <div
                    key={service._id}
                    className={`bg-card border rounded-2xl transition-all duration-300 ${
                      isExpanded
                        ? 'border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:shadow-lg hover:border-primary/30'
                    }`}
                  >
                    <div className="p-6 sm:p-8 flex flex-col h-full">
                      <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-5">
                        {serviceIconMap[service.icon || ''] ?? <Wrench className="w-7 h-7" />}
                      </div>

                      <h3 className="font-semibold text-xl text-foreground mb-2">
                        {service.name}
                      </h3>

                      <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">
                        {service.description}
                      </p>

                      {service.price != null && service.price > 0 && (
                        <p className="text-primary font-bold text-lg mb-5">
                          From ₹{service.price}
                        </p>
                      )}

                      <Button
                        size="sm"
                        variant={isExpanded ? 'default' : 'outline'}
                        className="gap-1.5 w-full"
                        onClick={() => toggleExpand(service._id)}
                      >
                        {isExpanded ? (
                          <>
                            Show Less
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Learn More
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ====== Expanded Detail Panel ====== */}
          {expandedId && services.length > 0 && (() => {
            const service = services.find((s) => s._id === expandedId);
            if (!service) return null;
            const info = getDetails(service);
            return (
              <div
                ref={panelRef}
                className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="bg-card border border-primary/20 rounded-2xl shadow-lg shadow-primary/5 overflow-hidden">
                  <div className="grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* LEFT — Service summary */}
                    <div className="md:col-span-2 p-6 sm:p-8 flex flex-col">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                        {serviceIconMap[service.icon || ''] ?? <Wrench className="w-6 h-6" />}
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {service.name}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                        {service.description}
                      </p>
                      {service.price != null && service.price > 0 && (
                        <p className="text-primary font-bold text-2xl mb-5">
                          From ₹{service.price}
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 w-full sm:w-auto"
                        onClick={() => setExpandedId(null)}
                      >
                        Show Less
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* RIGHT — Service details */}
                    <div className="md:col-span-3 p-6 sm:p-8 bg-muted/30">
                      <h4 className="text-lg font-bold text-foreground mb-3">
                        Service Details
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                        {info.details}
                      </p>

                      <div className="grid sm:grid-cols-3 gap-5">
                        {/* Equipment */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                              <Cpu className="w-4 h-4" />
                            </div>
                            <h5 className="text-sm font-semibold text-foreground">
                              Equipment Supported
                            </h5>
                          </div>
                          <ul className="space-y-2">
                            {info.equipment.map((item) => (
                              <li
                                key={item}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Installation Time */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                            <h5 className="text-sm font-semibold text-foreground">
                              Installation Time
                            </h5>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {info.installTime}
                          </p>
                        </div>

                        {/* Warranty */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <h5 className="text-sm font-semibold text-foreground">
                              Warranty
                            </h5>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {info.warranty}
                          </p>
                        </div>
                      </div>

                      {/* CTA inside panel */}
                      <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center gap-3">
                        <a
                          href={`https://wa.me/918778500296?text=Hello%20TN%20Automation%2C%20I%20would%20like%20to%20know%20more%20about%20${encodeURIComponent(service.name)}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" className="gap-1.5">
                            Get a Quote <ArrowRight className="w-4 h-4" />
                          </Button>
                        </a>
                        <a href="tel:+918778500296">
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <Phone className="w-4 h-4" /> Call Now
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ====== Testimonials ====== */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            What Our Clients Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary text-lg">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ====== Service Process ====== */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 p-12">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Our Service Process
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {processSteps.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-primary mb-1">
                  STEP {index + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== CTA Section ====== */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>

          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Contact our team today for a free security consultation and custom
            quote. We&apos;ll design the perfect CCTV solution for your
            property.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary" className="gap-2">
              Schedule Consultation <ArrowRight className="w-4 h-4" />
            </Button>

            <a href="tel:+918778500296">
              <Button
                size="lg"
                variant="outline"
                className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10 gap-2"
              >
                <Phone className="w-4 h-4" />
                +91 8778500296
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ====== WhatsApp Floating Button ====== */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
