import Link from 'next/link';
import { ShieldCheck, Cpu, BadgeCheck, Headphones, Camera, MoonStar, Smartphone, Wrench } from 'lucide-react';

const values = [
  {
    title: 'Security',
    description: 'We prioritize safety with high-quality surveillance systems.',
    icon: ShieldCheck,
  },
  {
    title: 'Innovation',
    description: 'We integrate the latest AI and smart monitoring technologies.',
    icon: Cpu,
  },
  {
    title: 'Reliability',
    description: 'Our products are tested for long-term durability and performance.',
    icon: BadgeCheck,
  },
  {
    title: 'Customer Support',
    description: 'We provide installation guidance and 24/7 support.',
    icon: Headphones,
  },
];

const features = [
  { title: 'HD Camera Systems', icon: Camera },
  { title: 'Night Vision Technology', icon: MoonStar },
  { title: 'Mobile Monitoring', icon: Smartphone },
  { title: 'Easy Installation', icon: Wrench },
];

export default function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <p className="text-sm md:text-base text-blue-100 font-medium tracking-wide">About TN Automation</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold leading-tight">
            Smart CCTV Solutions for Modern Security
          </h1>
          <p className="mt-4 max-w-3xl text-blue-50 text-base md:text-lg leading-relaxed">
            We provide advanced surveillance systems including HD cameras, AI-enabled monitoring, and complete security solutions for homes and businesses.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 md:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Our Mission</h2>
          <p className="mt-4 text-slate-600 leading-relaxed text-base md:text-lg">
            At TN Automation, our mission is to deliver reliable and intelligent security solutions that protect what matters most. We aim to make modern surveillance accessible, affordable, and easy to use for everyone.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12 md:pb-14">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Our Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {values.map((value) => (
            <div key={value.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  <value.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{value.title}</h3>
                  <p className="mt-1 text-slate-600">{value.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12 md:pb-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Why Choose Us?</h2>
          <p className="mt-4 text-slate-600 leading-relaxed text-base md:text-lg">
            With years of experience in the CCTV and security industry, TN Automation understands the importance of protection and reliability. We offer a wide range of products including bullet cameras, dome cameras, DVR/NVR systems, and complete installation services.
          </p>
          <p className="mt-4 text-slate-600 leading-relaxed text-base md:text-lg">
            Whether you're securing your home, office, or business, we provide tailored solutions to meet your needs.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12 md:pb-14">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Security Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 inline-flex rounded-full bg-blue-100 p-3 text-blue-700">
                <feature.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-slate-900">{feature.title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 md:pb-20">
        <div className="rounded-2xl bg-slate-900 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Secure Your Property with TN Automation</h2>
            <p className="mt-2 text-slate-200">Choose trusted surveillance solutions designed for modern safety.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Explore Products
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
