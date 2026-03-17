'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Shield } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      setForm({ name: '', email: '', phone: '', location: '', message: '' });
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] bg-indigo-500/20 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-400/10 rounded-full blur-[140px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-purple-200 text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full border border-white/10 mb-5">
            <Shield className="w-3.5 h-3.5" />
            Get In Touch
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">TN Automation</span>
          </h1>
          <p className="mt-4 text-purple-200/80 text-base md:text-lg max-w-xl mx-auto">
            Have questions about our CCTV solutions? Reach out and our security experts will get back to you within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Left — Contact info cards */}
          <div className="lg:col-span-2 space-y-5">
            {[
              {
                icon: Mail,
                title: 'Email Us',
                detail: 'kanimohan802@gmail.com',
                sub: 'We reply within 24 hours',
              },
              {
                icon: Phone,
                title: 'Call Us',
                detail: '+91 98765 43210',
                sub: 'Mon–Sat, 9 AM – 7 PM',
              },
              {
                icon: MapPin,
                title: 'Visit Us',
                detail: 'Tamil Nadu, India',
                sub: 'By appointment only',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/25">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-purple-200 text-sm mt-0.5">{item.detail}</p>
                  <p className="text-purple-300/60 text-xs mt-1">{item.sub}</p>
                </div>
              </div>
            ))}

            {/* Trust stats */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              {[
                { value: '500+', label: 'Installations' },
                { value: '24/7', label: 'Support' },
                { value: '100%', label: 'Satisfaction' },
              ].map((s) => (
                <div key={s.label} className="text-center bg-white/5 backdrop-blur border border-white/10 rounded-xl py-4 px-2">
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-[11px] text-purple-300/70 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Glassmorphism form */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/20">
              {status === 'success' ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-purple-200/80 text-sm max-w-sm mx-auto">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-8 text-sm font-medium text-purple-300 hover:text-white transition-colors underline underline-offset-4"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-white mb-1">Send us a Message</h2>
                  <p className="text-sm text-purple-200/70 mb-6">Fill in the form below and we&apos;ll respond promptly.</p>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 bg-red-500/15 border border-red-400/20 text-red-200 text-sm rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {errorMsg || 'Failed to send. Please try again.'}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-medium text-purple-200/80 mb-1.5">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-medium text-purple-200/80 mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-xs font-medium text-purple-200/80 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-xs font-medium text-purple-200/80 mb-1.5">
                        Location
                      </label>
                      <input
                        id="location"
                        name="location"
                        type="text"
                        required
                        value={form.location}
                        onChange={handleChange}
                        placeholder="Chennai, Tamil Nadu"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-medium text-purple-200/80 mb-1.5">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us about your security requirements..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === 'sending' ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
