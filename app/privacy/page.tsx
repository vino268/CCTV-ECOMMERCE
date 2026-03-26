export default function PrivacyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white shadow-md rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Privacy Policy
          </h1>

          <p className="text-gray-600 mb-6 text-center">
            At <span className="font-semibold">TN Automation</span>, we respect your privacy
            and are committed to protecting your personal information.
          </p>

          <div className="space-y-6">
            {/* 1 */}
            <div>
              <h2 className="font-semibold">1. Information We Collect</h2>
              <ul className="list-disc ml-6 text-gray-600 mt-2 space-y-1">
                <li>Name, email address, phone number</li>
                <li>Shipping and billing address</li>
                <li>Order history and purchase details</li>
                <li>Customer support communications</li>
              </ul>
            </div>

            {/* 2 */}
            <div>
              <h2 className="font-semibold">2. How We Use Your Information</h2>
              <ul className="list-disc ml-6 text-gray-600 mt-2 space-y-1">
                <li>Process and deliver your orders</li>
                <li>Improve our products and services</li>
                <li>Provide customer support</li>
                <li>Send updates and offers (with your consent)</li>
              </ul>
            </div>

            {/* 3 */}
            <div>
              <h2 className="font-semibold">3. Information Sharing</h2>
              <p className="text-gray-600 mt-2">
                We do not sell your personal information. We may share it only with trusted service providers
                to operate our business or comply with legal obligations.
              </p>
            </div>

            {/* 4 */}
            <div>
              <h2 className="font-semibold">4. Data Security</h2>
              <p className="text-gray-600 mt-2">
                We implement appropriate security measures to protect your personal data from unauthorized access.
              </p>
            </div>

            {/* 5 */}
            <div>
              <h2 className="font-semibold">5. Your Rights</h2>
              <p className="text-gray-600 mt-2">
                You have the right to access, update, or delete your personal information at any time.
              </p>
            </div>

            {/* 6 */}
            <div>
              <h2 className="font-semibold">6. Contact</h2>
              <p className="text-gray-600 mt-2">
                📧 tnautomation@yahoo.com <br />
                📞 +91 78452 83678
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
