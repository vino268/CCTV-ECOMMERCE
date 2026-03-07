'use client';

import { useState } from 'react';
import { services } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Wrench,
  Shield,
  Clock,
  Cpu,
  Camera,
  HardDrive,
  Wifi,
  Phone,
  ClipboardList,
  PenTool,
  Settings,
  Headphones,
} from 'lucide-react';

const serviceDetails: Record<
  string,
  {
    details: string;
    equipment: string[];
    installationTime: string;
    warranty: string;
  }
> = {
  'CCTV Installation': {
    details:
      'Our certified technicians handle end-to-end CCTV installation including site survey, cable routing, camera mounting, DVR/NVR setup, and mobile app configuration. We ensure every angle of your property is covered with optimal camera placement.',
    equipment: [
      'Dome & Bullet Cameras',
      'PTZ Cameras',
      'DVR / NVR Recorders',
      'PoE Switches & Cabling',
      'Monitors & Storage Drives',
    ],
    installationTime: '1 - 3 business days',
    warranty: '2-year installation warranty + 1-year equipment warranty',
  },
  'Security Consultation': {
    details:
      'Our security experts conduct a thorough assessment of your property to identify vulnerabilities and recommend the ideal camera types, placement, and recording solutions tailored to your budget and security goals.',
    equipment: [
      'Thermal Imaging Scanners',
      'Site Mapping Tools',
      'Risk Assessment Software',
      'Network Analysis Equipment',
    ],
    installationTime: 'Same-day consultation (1 - 2 hours)',
    warranty: 'Free follow-up consultation within 30 days',
  },
  'Maintenance & Repair': {
    details:
      'Keep your security system running at peak performance with scheduled maintenance visits and on-call repair services. We clean lenses, check connections, update firmware, and replace faulty components.',
    equipment: [
      'All CCTV Camera Brands',
      'DVR / NVR Systems',
      'Cabling & Connectors',
      'Power Supplies & UPS',
      'Network Equipment',
    ],
    installationTime: 'Emergency: within 24 hours | Scheduled: 1 - 2 days',
    warranty: '90-day repair warranty on all serviced components',
  },
  'Smart Home Security': {
    details:
      'Integrate your CCTV system with smart home automation including motion-triggered alerts, voice-assistant control, automated lighting, smart locks, and remote monitoring from anywhere in the world.',
    equipment: [
      'Smart IP Cameras',
      'IoT Hub & Controllers',
      'Smart Locks & Sensors',
      'Voice Assistant Integration',
      'Mobile App Dashboard',
    ],
    installationTime: '2 - 5 business days',
    warranty: '2-year system warranty + lifetime app updates',
  },
  'Cloud Storage & Backup': {
    details:
      'Secure your surveillance footage with encrypted cloud storage accessible 24/7 from any device. Automatic backup ensures you never lose critical footage even if on-site equipment is damaged or stolen.',
    equipment: [
      'Cloud-compatible NVRs',
      'Encrypted Storage Servers',
      'High-speed Network Routers',
      'Redundant Backup Systems',
    ],
    installationTime: 'Same-day cloud setup & configuration',
    warranty: '99.9% uptime SLA + 1-year subscription included',
  },
};

const serviceIcons: Record<string, React.ReactNode> = {
  'CCTV Installation': <Camera className="w-7 h-7" />,
  'Security Consultation': <Shield className="w-7 h-7" />,
  'Maintenance & Repair': <Wrench className="w-7 h-7" />,
  'Smart Home Security': <Wifi className="w-7 h-7" />,
  'Cloud Storage & Backup': <HardDrive className="w-7 h-7" />,
};

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

export default function ServicesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const whatsappNumber = '16155551234';
  const whatsappMessage = encodeURIComponent(
    'Hello TN Automation, I would like to know more about your CCTV services.'
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Our Services</h1>
          <p className="text-muted-foreground">
            Professional security solutions and support from our expert team
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {services.map((service) => {
            const isExpanded = expandedId === service.id;
            const details = serviceDetails[service.name];
            const icon = serviceIcons[service.name];

            return (
              <div
                key={service.id}
                className={`bg-card border rounded-lg transition-all duration-300 ${
                  isExpanded
                    ? 'border-primary shadow-lg md:col-span-2 lg:col-span-3'
                    : 'border-border hover:shadow-lg hover:scale-105'
                }`}
              >
                <div className="p-6">
                  <div className={`${isExpanded ? 'flex flex-col md:flex-row md:gap-8' : ''}`}>
                    {/* Card Core */}
                    <div className={`${isExpanded ? 'md:w-1/3' : ''}`}>
                      {/* Icon */}
                      <div className="w-14 h-14 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                        {icon || <span className="text-2xl">{service.icon}</span>}
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-semibold text-lg text-foreground mb-2">
                        {service.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {service.description}
                      </p>

                      {/* Price + Button */}
                      <div className="flex items-center justify-between">
                        {service.price && (
                          <span className="text-lg font-bold text-primary">
                            From ${service.price}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant={isExpanded ? 'default' : 'outline'}
                          onClick={() => toggleExpand(service.id)}
                          className="gap-1"
                        >
                          {isExpanded ? 'Show Less' : 'Learn More'}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && details && (
                      <div className="mt-6 md:mt-0 md:w-2/3 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8">
                        <h4 className="font-semibold text-foreground mb-3">
                          Service Details
                        </h4>
                        <p className="text-muted-foreground text-sm mb-6">
                          {details.details}
                        </p>

                        <div className="grid sm:grid-cols-3 gap-6">
                          {/* Equipment */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Cpu className="w-4 h-4 text-primary" />
                              <h5 className="font-semibold text-sm text-foreground">
                                Equipment Supported
                              </h5>
                            </div>
                            <ul className="space-y-1.5">
                              {details.equipment.map((item, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm text-muted-foreground"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Installation Time */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Clock className="w-4 h-4 text-primary" />
                              <h5 className="font-semibold text-sm text-foreground">
                                Installation Time
                              </h5>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {details.installationTime}
                            </p>
                          </div>

                          {/* Warranty */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Shield className="w-4 h-4 text-primary" />
                              <h5 className="font-semibold text-sm text-foreground">
                                Warranty
                              </h5>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {details.warranty}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Service Features */}
        <div className="bg-muted/30 rounded-lg border border-border p-12 mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            What&apos;s Included in Our Services?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              'Site assessment and security audit',
              'Professional system design',
              'Expert installation by trained technicians',
              '24/7 technical support',
              'Maintenance and monitoring',
              'Rapid emergency response',
              'Competitive pricing with flexible payment',
              'Warranty and guarantee coverage',
            ].map((feature, index) => (
              <div key={index} className="flex gap-3 items-start">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            What Our Clients Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
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
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Process */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20 p-12">
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
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Contact our team today for a free security consultation and custom quote.
            We&apos;ll design the perfect CCTV solution for your property.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary" className="gap-2">
              Schedule Consultation <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10 gap-2"
            >
              <Phone className="w-4 h-4" />
              +1 (615) 555-1234
            </Button>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
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
