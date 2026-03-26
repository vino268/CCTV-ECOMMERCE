export default function TermsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white shadow-md rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Terms & Conditions
          </h1>

          <p className="text-gray-600 mb-6 text-center">
            Welcome to <span className="font-semibold">TN Automation</span>.
            By accessing or using our website, you agree to comply with the following terms and conditions.
          </p>

          <div className="space-y-6">
            {/* 1 */}
            <div>
              <h2 className="font-semibold">1. General</h2>
              <p className="text-gray-600 mt-2">
                TN Automation provides CCTV cameras, security systems, and related services.
                These terms apply to all users, customers, and visitors of our website.
              </p>
            </div>

            {/* 2 */}
            <div>
              <h2 className="font-semibold">2. Products & Services</h2>
              <ul className="list-disc ml-6 text-gray-600 mt-2 space-y-1">
                <li>CCTV Cameras (Dome, Bullet, PTZ, Wireless)</li>
                <li>Security Accessories and Recorders</li>
                <li>Installation and Maintenance Services</li>
                <li>Technical Support and Consultation</li>
              </ul>
              <p className="text-gray-600 mt-2">
                We strive to ensure all product details are accurate, but minor variations may occur.
              </p>
            </div>

            {/* 3 */}
            <div>
              <h2 className="font-semibold">3. Orders & Payments</h2>
              <ul className="list-disc ml-6 text-gray-600 mt-2 space-y-1">
                <li>All orders are subject to availability</li>
                <li>Prices are listed in INR (₹)</li>
                <li>Payments are processed securely</li>
                <li>We reserve the right to cancel or refuse any order</li>
              </ul>
            </div>

            {/* 4 */}
            <div>
              <h2 className="font-semibold">4. Shipping & Delivery</h2>
              <p className="text-gray-600 mt-2">
                Delivery timelines vary based on location. TN Automation is not responsible for delays
                caused by courier services or unforeseen circumstances.
              </p>
            </div>

            {/* 5 */}
            <div>
              <h2 className="font-semibold">5. Installation Services</h2>
              <p className="text-gray-600 mt-2">
                Installation services are provided based on availability. Additional charges may apply
                depending on site requirements and complexity.
              </p>
            </div>

            {/* 6 */}
            <div>
              <h2 className="font-semibold">6. Warranty & Support</h2>
              <ul className="list-disc ml-6 text-gray-600 mt-2 space-y-1">
                <li>Products may include manufacturer warranty</li>
                <li>Warranty does not cover misuse or physical damage</li>
                <li>Unauthorized repairs void warranty</li>
              </ul>
            </div>

            {/* 7 */}
            <div>
              <h2 className="font-semibold">7. User Responsibilities</h2>
              <ul className="list-disc ml-6 text-gray-600 mt-2 space-y-1">
                <li>Provide accurate information</li>
                <li>Do not misuse the website</li>
                <li>Comply with applicable laws</li>
              </ul>
            </div>

            {/* 8 */}
            <div>
              <h2 className="font-semibold">8. Limitation of Liability</h2>
              <p className="text-gray-600 mt-2">
                TN Automation is not liable for indirect damages, loss of data, or misuse of products.
              </p>
            </div>

            {/* 9 */}
            <div>
              <h2 className="font-semibold">9. Changes to Terms</h2>
              <p className="text-gray-600 mt-2">
                We reserve the right to update these terms at any time without prior notice.
              </p>
            </div>

            {/* 10 */}
            <div>
              <h2 className="font-semibold">10. Contact</h2>
              <p className="text-gray-600 mt-2">
                📞 +91 78452 83678 <br />
                📧 tnautomation@yahoo.com <br />
                📍 33F, Sai Complex, Evk Sampath Salai,<br />
                Moolapatrai Road, Erode – 638003
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
