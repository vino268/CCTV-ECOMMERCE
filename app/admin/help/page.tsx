'use client';

import { Mail, Phone, FileText, HelpCircle, ExternalLink } from 'lucide-react';

const faqs = [
  {
    q: 'How do I add a new product?',
    a: 'Go to Products in the sidebar, then click "Add Product" button. Fill in the details and click Save.',
  },
  {
    q: 'How do I manage orders?',
    a: 'Navigate to Orders from the sidebar. You can view, update status, and track all customer orders.',
  },
  {
    q: 'How do I change my password?',
    a: 'Click the avatar icon in the header and select "Change Password", or navigate to the Change Password page from the sidebar.',
  },
  {
    q: 'How do I update store settings?',
    a: 'Go to Settings from the sidebar. You can update store name, contact information, and social media links.',
  },
  {
    q: 'How do I handle customer inquiries?',
    a: 'Check the Notifications page for new orders and customer activities. Use the Customers page to view customer details.',
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground text-sm">Get assistance with the admin panel</p>
      </div>

      {/* Contact Developer */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          Contact Developer
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a
              href="mailto:vinothelango2110@gmail.com"
              className="text-foreground hover:text-primary transition-colors"
            >
              vinothelango2110@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <a href="tel:+917845283678" className="text-foreground hover:text-primary transition-colors">
              +91 78452 83678
            </a>
          </div>
          <div className="pt-1">
            <a
              href="https://wa.me/917845283678"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Documentation
        </h2>
        <ul className="space-y-2">
          {[
            { label: 'Admin Dashboard Guide', desc: 'Overview of all dashboard features' },
            { label: 'Product Management', desc: 'How to add, edit, and delete products' },
            { label: 'Order Processing', desc: 'Managing customer orders end to end' },
            { label: 'Store Settings', desc: 'Configuring your store information' },
          ].map((doc) => (
            <li key={doc.label}>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <ExternalLink className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.label}</p>
                  <p className="text-xs text-muted-foreground">{doc.desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* FAQ */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-foreground mb-1">{faq.q}</p>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
