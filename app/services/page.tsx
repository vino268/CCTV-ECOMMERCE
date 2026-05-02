'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, MapPin, MessageCircle, Phone, PhoneCall, Smartphone, Wrench, X } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */

interface Service {
  _id: string;
  title?: string;
  name: string;
  description: string;
  price?: number;
}

/* ------------------------------------------------------------------ */
/*  PAGE COMPONENT                                                    */
/* ------------------------------------------------------------------ */

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const serviceProcessSteps = [
    {
      label: 'STEP 1',
      title: 'Consultation',
      description: 'Share your security needs and get expert CCTV recommendations for your space.',
      icon: PhoneCall,
    },
    {
      label: 'STEP 2',
      title: 'Site Inspection',
      description: 'Our team evaluates your location and suggests ideal camera positions and coverage.',
      icon: MapPin,
    },
    {
      label: 'STEP 3',
      title: 'Installation',
      description: 'Professional setup with clean wiring, quick configuration, and quality checks.',
      icon: Wrench,
    },
    {
      label: 'STEP 4',
      title: 'Live Monitoring',
      description: 'Access live feeds and alerts from mobile with reliable remote monitoring support.',
      icon: Smartphone,
    },
  ];

  useEffect(() => {
    fetch(buildApiUrl('/api/services'), { credentials: 'include' })
      .then((res) => parseResponseBody<any>(res))
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        const mapped = rows.map((service: any) => ({
          ...service,
          name: String(service?.name || service?.title || '').trim(),
        }));
        setServices(mapped.filter((service: Service) => Boolean(service.name)));
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeService) {
      setName('');
      setPhoneNumber('');
      setMessage('');
      setFormError('');
      setFormSuccess('');
      setSubmitting(false);
    }
  }, [activeService]);

  const handleBookingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !phoneNumber.trim()) {
      setFormError('Please enter your name and phone number.');
      setFormSuccess('');
      return;
    }

    const selectedServiceType = activeService?.name?.trim();

    if (!selectedServiceType) {
      setFormError('Please select a service and try again.');
      setFormSuccess('');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const response = await fetch(buildApiUrl('/api/support'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneNumber.trim(),
          serviceType: selectedServiceType,
          message: message.trim(),
        }),
      });

      const result = await parseResponseBody<any>(response);

      if (!response.ok || !result.success) {
        setFormError(result.message || 'Failed to send request. Please try again.');
        setFormSuccess('');
        return;
      }

      setFormSuccess(
        result.message || `${selectedServiceType} request sent successfully!`
      );
      setName('');
      setPhoneNumber('');
      setMessage('');
    } catch {
      setFormError('Failed to send request. Please try again.');
      setFormSuccess('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Our Services
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Professional security solutions and support from our expert team
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-md animate-pulse"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-full mx-auto mb-5" />
                <div className="h-5 bg-gray-200 rounded w-2/3 mx-auto mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-4/5 mx-auto mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-5" />
                <div className="h-10 bg-gray-200 rounded-lg w-full" />
              </div>
            ))
          ) : services.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-600 bg-white rounded-2xl shadow-md">
              No services available at the moment. Please check back soon.
            </div>
          ) : (
            services.map((service, index) => {
              const serviceId = service._id || `${service.name}-${index}`;

              return (
              <div
                key={serviceId}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 p-6 flex flex-col"
              >
                <div className="w-14 h-14 bg-blue-100 p-3 rounded-full flex items-center justify-center mx-auto text-blue-600">
                  <Wrench className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-semibold mt-3 mb-2 text-gray-900 text-center">
                  {service.name}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed mb-5 text-center flex-1">
                  {service.description}
                </p>

                <div className="mb-5 text-center min-h-[54px]">
                  {service.price && service.price > 0 && (
                    <>
                      <span className="inline-block text-xs font-medium uppercase tracking-wide text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-2">
                        Starting from
                      </span>
                      <p className="text-blue-600 font-bold text-lg">{formatPrice(service.price)}</p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveService(service)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition-colors duration-300"
                >
                  Get Service
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              );
            })
          )}
          </div>
        </div>

        <section className="rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50 border border-gray-200 p-6 md:p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Our Service Process</h2>
            <p className="mt-2 text-gray-600 text-sm md:text-base">
              Simple, fast and professional CCTV installation workflow
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {serviceProcessSteps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl bg-white p-5 text-center shadow-md hover:shadow-xl transition-all duration-300"
              >
                <span className="inline-block text-[11px] font-semibold tracking-wide text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full mb-3">
                  {step.label}
                </span>

                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <step.icon className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div
        className={`fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${
          activeService
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setActiveService(null)}
      >
        <div
          className={`w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto transition-all duration-300 ease-in-out ${
            activeService ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {activeService?.name || 'Service Support'}
            </h2>
            <button
              type="button"
              onClick={() => setActiveService(null)}
              className="text-gray-500 hover:text-black text-xl transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {activeService?.name}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-5">
            {activeService?.description} Our experts provide complete planning,
            installation, and reliable after-sales support tailored to your
            property.
          </p>

          <form className="mb-4" onSubmit={handleBookingSubmit}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full p-3 text-sm sm:text-base rounded-lg border mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="w-full p-3 text-sm sm:text-base rounded-lg border mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={activeService?.name || ''}
              readOnly
              className="w-full p-3 text-sm sm:text-base rounded-lg border mb-3 bg-gray-50 text-gray-600"
            />
            <textarea
              placeholder="Message (optional)"
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full p-3 text-sm sm:text-base rounded-lg border mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-300"
            >
              {submitting ? 'Sending...' : 'Submit Request'}
            </button>
          </form>

          {formError && (
            <p className="text-sm text-red-600 mb-4">{formError}</p>
          )}

          {formSuccess && (
            <p className="text-sm text-green-600 mb-4">{formSuccess}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <a
              href="tel:+917845283678"
              className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors duration-300"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>

            <a
              href={`https://wa.me/917845283678?text=${encodeURIComponent(
                `I am interested in your ${activeService?.name || 'CCTV'} service`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors duration-300"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
