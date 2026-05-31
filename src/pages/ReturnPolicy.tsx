import React from 'react';

const ReturnPolicy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-32">
      <h1 className="text-5xl font-serif tracking-tighter mb-4">Return & Refund <span className="italic font-light opacity-60">Policy</span></h1>
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-16">Last updated: January 2026</p>

      <div className="prose prose-sm max-w-none space-y-10 text-black/80 leading-relaxed">
        <section>
          <h2 className="text-xl font-serif text-primary mb-4">Return Window</h2>
          <p className="text-sm leading-relaxed">
            We accept returns within <strong>7 days</strong> of delivery. To be eligible for a return, your item must be unused, 
            unworn, and in the same condition that you received it. It must also be in the original packaging with all tags attached.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">How to Initiate a Return</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Contact us at <strong>9535770750</strong> or email us with your order number.</li>
            <li>We will provide you with a return shipping address and instructions.</li>
            <li>Pack the item securely in its original packaging.</li>
            <li>Ship the item back to us using a trackable shipping method.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">Refund Process</h2>
          <p className="text-sm leading-relaxed">
            Once we receive and inspect your return, we will notify you of the approval or rejection of your refund. 
            If approved, your refund will be processed within <strong>5–7 business days</strong> to your original payment method.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">Non-Returnable Items</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Items purchased on sale or with a discount code</li>
            <li>Intimate wear and personal accessories</li>
            <li>Items that have been used, washed, or altered</li>
            <li>Items without original tags and packaging</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">Exchanges</h2>
          <p className="text-sm leading-relaxed">
            We currently do not offer direct exchanges. If you need a different size or color, please return the original 
            item for a refund and place a new order.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">Damaged or Defective Items</h2>
          <p className="text-sm leading-relaxed">
            If you receive a damaged or defective item, please contact us within 48 hours of delivery with photos of the 
            damage. We will arrange a replacement or full refund at no additional cost to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-primary mb-4">Contact Us</h2>
          <p className="text-sm leading-relaxed">
            For any return or refund queries, please reach out to us:<br />
            Phone: <strong>9535770750</strong><br />
            Email: contact@zarevielle.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default ReturnPolicy;
