import React, { useState } from 'react';
import { Phone, Mail, Send, CheckCircle } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-40 text-center space-y-8">
        <CheckCircle size={60} className="mx-auto text-green-600" />
        <h1 className="text-4xl font-serif tracking-tighter text-primary">Message Sent</h1>
        <p className="text-sm text-black/70 max-w-md mx-auto">
          Thank you for reaching out. We'll get back to you within 24–48 hours.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="px-8 py-3 bg-primary text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-full hover:bg-black transition-all"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-32">
      <h1 className="text-5xl font-serif tracking-tighter mb-4">Get in <span className="italic font-light opacity-60">Touch</span></h1>
      <p className="text-sm text-black/60 mb-16 max-w-lg">
        We'd love to hear from you. Whether you have a question about our products, an order, or anything else — our team is here to help.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Contact Form */}
        <div className="lg:col-span-7">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.3em] text-black font-bold ml-2">Your Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border-tan/30 p-4 px-6 rounded-full text-[11px] uppercase tracking-widest focus:outline-none focus:border-primary shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.3em] text-black font-bold ml-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border-tan/30 p-4 px-6 rounded-full text-[11px] uppercase tracking-widest focus:outline-none focus:border-primary shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.3em] text-black font-bold ml-2">Subject</label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-surface border border-border-tan/30 p-4 px-6 rounded-full text-[11px] uppercase tracking-widest focus:outline-none focus:border-primary shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.3em] text-black font-bold ml-2">Message</label>
              <textarea
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-surface border border-border-tan/30 p-4 px-6 rounded-3xl text-sm focus:outline-none focus:border-primary shadow-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-3 px-10 py-4 bg-primary text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-full hover:bg-black transition-all disabled:opacity-50 shadow-lg"
            >
              <Send size={14} />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Contact Info Sidebar */}
        <div className="lg:col-span-5">
          <div className="bg-surface border border-border-tan/30 rounded-[40px] p-10 space-y-10 card-shadow">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <Phone size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-black/50 font-bold">Phone</p>
                    <p className="text-sm font-medium">9535770750</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <Mail size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-black/50 font-bold">Email</p>
                    <p className="text-sm font-medium">contact@zarevielle.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border-tan/20">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary mb-4">Business Hours</h3>
              <div className="space-y-2 text-sm text-black/70">
                <p>Monday – Saturday: 10:00 AM – 7:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>

            <div className="pt-8 border-t border-border-tan/20">
              <p className="text-xs italic text-black/50 font-serif leading-relaxed">
                "Crafted for the everyday extraordinary"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
