import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-32">
      <h1 className="text-5xl font-serif tracking-tighter mb-4">Terms & <span className="italic font-light opacity-60">Conditions</span></h1>
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-16">Last updated: January 2026</p>

      <div className="prose prose-sm max-w-none space-y-10 text-black/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-serif text-primary mb-4">1. Introduction</h2>
          <p className="text-sm leading-relaxed">
            Welcome to Zarevielle. These Terms and Conditions govern your use of our website and the purchase of products 
            from our online store. By accessing or using our website, you agree to be bound by these terms. Zarevielle is 
            a business registered in India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">2. Account Terms</h2>
          <p className="text-sm leading-relaxed">
            You may browse our website without creating an account. To make a purchase, you may sign in using Google 
            authentication. You are responsible for maintaining the security of your account and for all activities that 
            occur under your account. You must provide accurate and complete information when creating an account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">3. Ordering & Payment</h2>
          <p className="text-sm leading-relaxed">
            All orders are subject to availability. We reserve the right to refuse or cancel any order for any reason, 
            including but not limited to product availability, errors in pricing, or suspected fraudulent activity. 
            Payments are processed securely through Razorpay. By placing an order, you confirm that the payment details 
            provided are valid and that you are authorized to use the payment method.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">4. Pricing</h2>
          <p className="text-sm leading-relaxed">
            All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes. We reserve the right to 
            change prices at any time without prior notice. The price applicable to your order is the price displayed at 
            the time of purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">5. Shipping & Delivery</h2>
          <p className="text-sm leading-relaxed">
            We aim to dispatch all orders within 2–3 business days. Delivery timelines depend on your location and the 
            shipping method selected. We are not responsible for delays caused by shipping carriers or customs processing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">6. Intellectual Property</h2>
          <p className="text-sm leading-relaxed">
            All content on this website, including but not limited to text, graphics, logos, images, product designs, and 
            software, is the property of Zarevielle and is protected by Indian and international copyright, trademark, and 
            other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any 
            content without our express written permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">7. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed">
            To the fullest extent permitted by law, Zarevielle shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages arising out of or related to your use of our website or products. Our total 
            liability shall not exceed the amount paid by you for the specific product giving rise to the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">8. Governing Law</h2>
          <p className="text-sm leading-relaxed">
            These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from 
            these terms or your use of our website shall be subject to the exclusive jurisdiction of the courts in India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">9. Changes to Terms</h2>
          <p className="text-sm leading-relaxed">
            We reserve the right to update these Terms and Conditions at any time. Changes will be effective immediately 
            upon posting to our website. Your continued use of the website after changes are posted constitutes your 
            acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">10. Contact</h2>
          <p className="text-sm leading-relaxed">
            For questions about these terms, please contact us:<br />
            Phone: <strong>9535770750</strong><br />
            Email: contact@zarevielle.com<br />
            Business: Zarevielle, India
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
