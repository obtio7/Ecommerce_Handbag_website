import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-32">
      <h1 className="text-5xl font-serif tracking-tighter mb-4">Privacy <span className="italic font-light opacity-60">Policy</span></h1>
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-16">Last updated: January 2026</p>

      <div className="prose prose-sm max-w-none space-y-10 text-black/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-serif text-primary mb-4">1. Information We Collect</h2>
          <p className="text-sm leading-relaxed">We collect the following types of personal information when you use our website:</p>
          <ul className="list-disc list-inside space-y-2 text-sm mt-3">
            <li><strong>Personal details:</strong> Name, email address, phone number</li>
            <li><strong>Shipping information:</strong> Delivery address, city, postal code</li>
            <li><strong>Payment information:</strong> Payment details processed securely through Razorpay (we do not store card numbers)</li>
            <li><strong>Account data:</strong> Google account information used for authentication</li>
            <li><strong>Usage data:</strong> Pages visited, time spent on site, browser type</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Processing and fulfilling your orders</li>
            <li>Sending order confirmations and shipping updates</li>
            <li>Communicating about your account or transactions</li>
            <li>Improving our website and customer experience</li>
            <li>Preventing fraud and ensuring security</li>
            <li>Complying with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">3. Third-Party Services</h2>
          <p className="text-sm leading-relaxed">We share your information with the following third-party services only as necessary:</p>
          <ul className="list-disc list-inside space-y-2 text-sm mt-3">
            <li><strong>Razorpay:</strong> For secure payment processing. Razorpay's privacy policy governs their handling of your payment data.</li>
            <li><strong>Google Firebase:</strong> For authentication services.</li>
            <li><strong>Shipping partners:</strong> Your name and address are shared with delivery services to fulfill your order.</li>
          </ul>
          <p className="text-sm leading-relaxed mt-3">
            We do not sell, rent, or trade your personal information to any third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">4. Data Security</h2>
          <p className="text-sm leading-relaxed">
            We implement appropriate technical and organizational measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the 
            internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">5. Cookies</h2>
          <p className="text-sm leading-relaxed">
            Our website uses cookies to enhance your browsing experience, maintain your session, and analyze site traffic. 
            You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">6. Your Rights</h2>
          <p className="text-sm leading-relaxed">You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 text-sm mt-3">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal obligations)</li>
            <li>Withdraw consent for marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">7. Data Retention</h2>
          <p className="text-sm leading-relaxed">
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, 
            comply with legal obligations, resolve disputes, and enforce our agreements. Order data is retained for a 
            minimum of 5 years for tax and legal compliance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">8. Changes to This Policy</h2>
          <p className="text-sm leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated 
            revision date. We encourage you to review this policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">9. Contact Us</h2>
          <p className="text-sm leading-relaxed">
            If you have any questions about this Privacy Policy or how we handle your data, please contact us:<br />
            Phone: <strong>9535770750</strong><br />
            Email: contact@zarevielle.com<br />
            Business: Zarevielle, India
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
