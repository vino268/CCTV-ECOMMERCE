'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
} from 'lucide-react';

const contactInfo = [
  {
    icon: Phone,
    title: 'Phone',
    details: ['+91 8778500296'],
    href: 'tel:+918778500296',
  },
  {
    icon: Mail,
    title: 'Email',
    details: ['info@tnautomation.com'],
    href: 'mailto:info@tnautomation.com',
  },
  {
    icon: MapPin,
    title: 'Address',
    details: ['123 Security Street', 'Nashville, TN 37201'],
    href: null,
  },
  {
    icon: Clock,
    title: 'Business Hours',
    details: ['Mon – Sat: 9 AM – 7 PM', 'Sunday: Closed'],
    href: null,
  },
];

const faqs = [
  {
    q: 'Do you offer free consultations?',
    a: 'Yes! We provide free on-site security assessments for homes and businesses.',
  },
  {
    q: 'What areas do you serve?',
    a: 'We serve all major cities and surrounding areas. Contact us to check availability in your location.',
  },
  {
    q: 'How long does installation take?',
    a: 'Most residential installations are completed within a day. Commercial projects typically take 2-5 business days.',
  },
  {
    q: 'Do you provide after-sales support?',
    a: 'Absolutely. All installations come with a 1-year warranty and 24/7 technical support.',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build the WhatsApp message from form data
    const text = `Hello TN Automation,%0A%0AName: ${encodeURIComponent(formData.name)}%0AEmail: ${encodeURIComponent(formData.email)}%0APhone: ${encodeURIComponent(formData.phone)}%0ASubject: ${encodeURIComponent(formData.subject)}%0A%0AMessage:%0A${encodeURIComponent(formData.message)}`;
    window.open(`https://wa.me/918778500296?text=${text}`, '_blank');
    setSubmitted(true);
  };

  const inputClass =
    'w-full border border-border/60 rounded-xl px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60';

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary via-secondary/95 to-primary/80 text-secondary-foreground py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,var(--primary)_0%,transparent_50%)] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <p className="text-primary-foreground/70 font-medium text-sm tracking-widest uppercase mb-4">
              Contact Us
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Get in Touch With Our Team
            </h1>
            <p className="text-lg text-secondary-foreground/80 max-w-2xl">
              Have questions about our CCTV solutions? Need a custom quote? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="relative -mt-10 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contactInfo.map((item, i) => {
              const Icon = item.icon;
              const Wrapper = item.href ? 'a' : 'div';
              const wrapperProps = item.href
                ? { href: item.href, target: '_blank' as const, rel: 'noopener noreferrer' }
                : {};
              return (
                <Wrapper
                  key={i}
                  {...wrapperProps}
                  className="bg-card border border-border/60 rounded-2xl p-5 text-center hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-accent/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                  {item.details.map((line, j) => (
                    <p key={j} className="text-xs text-muted-foreground">{line}</p>
                  ))}
                </Wrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form + Map Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-foreground mb-2">Send Us a Message</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. Our team will respond shortly.
                    </p>
                    <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: '', message: '' }); }}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="John Doe"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="john@example.com"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Subject *
                        </label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className={inputClass}
                        >
                          <option value="">Select a subject</option>
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Product Information">Product Information</option>
                          <option value="Installation Quote">Installation Quote</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Bulk Order">Bulk / Corporate Order</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Tell us how we can help you..."
                        className={inputClass + ' resize-none'}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2">
                      <Send className="w-4 h-4" />
                      Send Message via WhatsApp
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* WhatsApp Quick Contact */}
              <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/15 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Quick Chat</h3>
                    <p className="text-xs text-muted-foreground">Typically replies within minutes</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Need a fast response? Chat with us directly on WhatsApp for instant assistance.
                </p>
                <a
                  href="https://wa.me/918778500296?text=Hello%20TN%20Automation%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full gap-2 bg-green-500 hover:bg-green-600 text-white">
                    <MessageCircle className="w-4 h-4" />
                    Chat on WhatsApp
                  </Button>
                </a>
              </div>

              {/* Map Embed */}
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  <div className="text-center p-6">
                    <MapPin className="w-10 h-10 text-primary mx-auto mb-3" />
                    <p className="font-semibold text-foreground text-sm">TN Automation</p>
                    <p className="text-xs text-muted-foreground mt-1">123 Security Street, Nashville, TN 37201</p>
                    <a
                      href="https://maps.google.com/?q=123+Security+Street+Nashville+TN+37201"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3"
                    >
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <MapPin className="w-3 h-3" />
                        Open in Google Maps
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-muted/20 to-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Quick answers to common questions about our services
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border/60 rounded-xl p-5 hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
