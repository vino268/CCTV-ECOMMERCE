import {
  Shield,
  Clock,
  Award,
  Zap,
  Users,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Target,
  Eye,
} from 'lucide-react';

const milestones = [
  { year: '2004', title: 'Founded', desc: 'TN Automation was established with a vision to bring world-class security solutions to every doorstep.' },
  { year: '2010', title: 'Regional Expansion', desc: 'Expanded operations across multiple cities, serving over 500 commercial clients.' },
  { year: '2016', title: 'Smart Integration', desc: 'Introduced AI-powered surveillance and smart home security integrations.' },
  { year: '2024', title: '10,000+ Installs', desc: 'Crossed the milestone of 10,000 successful CCTV installations nationwide.' },
];

const teamValues = [
  { icon: Shield, title: 'Trust & Reliability', desc: 'We stand behind every product and installation with full warranties and support.' },
  { icon: Award, title: 'Quality First', desc: 'Only premium-grade equipment from globally trusted brands makes it to our catalog.' },
  { icon: Clock, title: '24/7 Support', desc: 'Our dedicated technical team is available around the clock for any assistance.' },
  { icon: Zap, title: 'Fast Turnaround', desc: 'From consultation to installation, we ensure quick and efficient project delivery.' },
];

const stats = [
  { value: '20+', label: 'Years of Experience' },
  { value: '10,000+', label: 'Installations Done' },
  { value: '5,000+', label: 'Happy Customers' },
  { value: '50+', label: 'Expert Technicians' },
];

export default function AboutPage() {
  return (
    <div className="bg-background">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-secondary via-secondary/95 to-primary/80 text-secondary-foreground py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,var(--primary)_0%,transparent_50%)] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <p className="text-primary-foreground/70 font-medium text-sm tracking-widest uppercase mb-4">
              About Us
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Securing What Matters Most Since 2004
            </h1>
            <p className="text-lg text-secondary-foreground/80 max-w-2xl">
              TN Automation is a leading provider of professional CCTV and security solutions,
              trusted by thousands of businesses and homeowners across the country.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-10 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card border border-border/60 rounded-2xl shadow-xl shadow-primary/5 p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-card border border-border/60 rounded-2xl p-8 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/5 text-primary rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To provide affordable, high-quality security surveillance solutions that empower
                businesses and homeowners with peace of mind. We aim to make professional-grade
                security accessible to everyone through expert consultation, premium products, and
                reliable after-sales support.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-card border border-border/60 rounded-2xl p-8 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-accent/5 text-accent-foreground rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To become the most trusted name in security solutions across the country — known
                for innovation, integrity, and customer satisfaction. We envision a future where
                every property is protected by smart, reliable, and cutting-edge surveillance
                technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Journey / Timeline */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-muted/20 to-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Journey</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From a small startup to a nationwide security provider — here's how we grew
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {milestones.map((item, i) => (
              <div key={i} className="relative bg-card border border-border/60 rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="text-sm font-bold text-primary mb-2">{item.year}</div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Sets Us Apart
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our core values drive everything we do — from product selection to customer service
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamValues.map((value, i) => {
              const Icon = value.icon;
              return (
                <div key={i} className="bg-card border border-border/60 rounded-xl p-6 text-center hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-accent/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Customers Choose Us (checklist style) */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Customers Trust Us
              </h2>
              <ul className="space-y-4">
                {[
                  'Free on-site consultation and security assessment',
                  'Custom system design tailored to your property',
                  'Certified and trained installation technicians',
                  'Same-day service and emergency support',
                  '1-year warranty on all products and installations',
                  'Flexible payment options including EMI',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-lg shadow-primary/5">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Get in Touch</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">123 Security Street, Nashville, TN 37201</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <a href="tel:+918778500296" className="text-muted-foreground hover:text-primary transition-colors">
                    +91 8778500296
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <a href="mailto:info@tnautomation.com" className="text-muted-foreground hover:text-primary transition-colors">
                    info@tnautomation.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
