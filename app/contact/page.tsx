import { Clock, Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Contact Us</h1>
          <p className="mt-3 text-gray-600 text-base md:text-lg">
            Have a question about products or installation? Our team is here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 md:p-7 w-full flex flex-col gap-5">
            <h2 className="text-2xl font-semibold text-gray-900">Send us a Message</h2>

            <form className="space-y-4 pt-1">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <input
                type="text"
                placeholder="Subject"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <textarea
                rows={5}
                placeholder="Message"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition"
              />

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-300"
              >
                Send Message
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6 md:p-7 w-full flex flex-col gap-5">
            <h2 className="text-2xl font-semibold text-gray-900">Contact Details</h2>

            <div className="space-y-5 pt-1">
              <div className="group flex items-start gap-3 text-gray-700 p-3 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-300">
                <Phone className="w-5 h-5 mt-0.5 text-blue-600 group-hover:text-blue-800 transition-colors duration-300" />
                <div>
                  <p className="font-semibold text-gray-900">PHONE</p>
                  <a href="tel:+917845283678" className="text-gray-700 hover:text-blue-600 transition">
                    +91 78452 83678
                  </a>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="group flex items-start gap-3 text-gray-700 p-3 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-300">
                <Mail className="w-5 h-5 mt-0.5 text-blue-600 group-hover:text-blue-800 transition-colors duration-300" />
                <div>
                  <p className="font-semibold text-gray-900">EMAIL</p>
                  <a href="mailto:tnautomation@yahoo.com" className="text-gray-700 hover:text-blue-600 transition">
                    tnautomation@yahoo.com
                  </a>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="group flex items-start gap-3 text-gray-700 p-3 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-300">
                <MapPin className="w-5 h-5 mt-0.5 text-blue-600 group-hover:text-blue-800 transition-colors duration-300" />
                <div>
                  <p className="font-semibold text-gray-900">ADDRESS</p>
                  <p className="text-gray-700 leading-relaxed">
                    33F, Sai Complex,<br />
                    Evk Sampath Salai,<br />
                    Moolapatrai Road,<br />
                    Erode - 638003
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="group flex items-start gap-3 text-gray-700 p-3 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-300">
                <Clock className="w-5 h-5 mt-0.5 text-blue-600 group-hover:text-blue-800 transition-colors duration-300" />
                <div>
                  <p className="font-semibold text-gray-900">BUSINESS HOURS</p>
                  <p className="text-gray-700">Mon - Sat: 9:00 AM - 8:00 PM</p>
                  <p className="text-gray-700">Sunday: 10:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}