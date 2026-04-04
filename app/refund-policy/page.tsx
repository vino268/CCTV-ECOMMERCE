import { Mail, Phone, Clock, CreditCard, RefreshCcw, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] py-12 px-4 md:px-0">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-900">Refund Policy</h1>
        <div className="space-y-8">
          {/* Refund Methods */}
          <section className="bg-white rounded-2xl shadow p-6 flex gap-4 items-start">
            <CreditCard className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Refund Methods</h2>
              <ul className="text-gray-700 space-y-1">
                <li>Refunds will be processed to the original payment method.</li>
                <li className="mt-2"><span className="font-medium">UPI / Wallets (GPay, PhonePe, Paytm):</span> 2–3 business days</li>
                <li><span className="font-medium">Credit/Debit Cards:</span> 5–7 business days</li>
                <li><span className="font-medium">Bank Transfer:</span> 3–5 business days</li>
              </ul>
            </div>
          </section>

          {/* Refund Timeline */}
          <section className="bg-white rounded-2xl shadow p-6 flex gap-4 items-start">
            <RefreshCcw className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Refund Timeline</h2>
              <ul className="text-gray-700 space-y-1">
                <li>Order cancelled within 1 hour → <span className="font-medium">Instant refund</span></li>
                <li>Approved returns → <span className="font-medium">2–3 business days processing</span></li>
                <li>High-value orders (&gt;₹50,000) → <span className="font-medium">5–7 business days</span></li>
              </ul>
            </div>
          </section>

          {/* Refund Conditions */}
          <section className="bg-white rounded-2xl shadow p-6 flex gap-4 items-start">
            <ShieldCheck className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Refund Conditions</h2>
              <div className="mb-2">
                <span className="font-semibold text-green-700">Eligible for Full Refund:</span>
                <ul className="list-disc ml-6 text-gray-700">
                  <li>Product returned within 7–10 days</li>
                  <li>Defective or damaged CCTV products</li>
                  <li>Wrong product delivered</li>
                  <li>Order cancelled before dispatch</li>
                </ul>
              </div>
              <div>
                <span className="font-semibold text-red-700">Not Eligible / Partial Refund:</span>
                <ul className="list-disc ml-6 text-gray-700">
                  <li>Physical damage caused by user</li>
                  <li>Installed/used products</li>
                  <li>Missing accessories or packaging</li>
                  <li>Custom installation services already completed</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-white rounded-2xl shadow p-6 flex gap-4 items-start">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Important Notes</h2>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Installation charges are non-refundable once service is completed</li>
                <li>Refunds are not applicable for completed service visits</li>
                <li>If issue is technical, replacement/repair will be preferred over refund</li>
                <li>Delays may occur during high-demand periods</li>
              </ul>
            </div>
          </section>

          {/* Need Help? */}
          <section className="help-box-wrapper bg-white rounded-2xl shadow p-6 flex gap-4 items-start">
            <Info className="h-8 w-8 text-blue-600 mt-1" />
            <div className="help-box">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Need Help?</h2>
              <p className="flex items-center gap-2"><Mail className="h-5 w-5 text-blue-500" /> tnautomation@yahoo.com</p>
              <p className="flex items-center gap-2"><Phone className="h-5 w-5 text-blue-500" /> +91 78452 83678</p>
              <p className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" /> Support Hours: Mon–Sat (9AM – 7PM)</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
