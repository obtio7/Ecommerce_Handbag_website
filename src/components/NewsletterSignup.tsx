import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, X, Sparkles, Check, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface NewsletterSignupProps {
  variant?: 'inline' | 'popup' | 'footer';
  onClose?: () => void;
}

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ variant = 'inline', onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          source: variant === 'popup' ? 'popup' : variant === 'footer' ? 'footer' : 'other' 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setEmail('');
        // Auto-close popup after success
        if (variant === 'popup' && onClose) {
          setTimeout(onClose, 3000);
        }
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Footer variant - minimal inline form
  if (variant === 'footer') {
    return (
      <div className="space-y-4">
        <p className="text-[10px] md:text-[11px] text-black mb-4 md:mb-6 italic font-serif">
          Sign up for early access to seasonal arrivals.
        </p>
        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-green-600"
          >
            <Check size={16} />
            <span className="text-[11px] uppercase tracking-widest font-bold">You're in!</span>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex border-b border-primary/20 pb-2 max-w-xs">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="bg-transparent text-[10px] md:text-[11px] uppercase tracking-widest flex-1 focus:outline-none min-w-0"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-primary ml-2 hover:text-black transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : 'Join'}
              </button>
            </div>
            {error && (
              <p className="text-[10px] text-red-500">{error}</p>
            )}
          </form>
        )}
      </div>
    );
  }

  // Popup variant - modal style
  if (variant === 'popup') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[32px] p-8 md:p-12 max-w-md w-full relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-surface rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Decorative element */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-primary" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
                Exclusive Access
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif tracking-tighter mb-4">
              Join the <span className="italic font-light">Archive</span>
            </h2>

            <p className="text-sm text-black/60 mb-8 leading-relaxed">
              Be the first to discover new collections, receive exclusive offers, and get behind-the-scenes access to our artisan stories.
            </p>

            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-serif mb-2">Welcome to Zarevielle!</h3>
                <p className="text-sm text-black/60">Check your inbox for a special welcome.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-4 bg-surface border border-border-tan/30 rounded-full text-sm focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white text-[11px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Subscribe'
                  )}
                </button>
                <p className="text-[10px] text-black/40 text-center">
                  Unsubscribe anytime. We respect your privacy.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Inline variant - for homepage sections
  return (
    <div className="bg-surface rounded-[32px] p-8 md:p-12 border border-border-tan/30">
      <div className="max-w-xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Mail size={20} className="text-primary" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
            Newsletter
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-serif tracking-tighter mb-4">
          Stay <span className="italic font-light">Connected</span>
        </h2>

        <p className="text-sm text-black/60 mb-8">
          Subscribe for exclusive previews, artisan stories, and special offers.
        </p>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-green-600 py-4"
          >
            <Check size={20} />
            <span className="text-sm font-medium">Thank you for subscribing!</span>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-white border border-border-tan/30 rounded-full text-sm focus:outline-none focus:border-primary transition-colors"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-primary text-white text-[11px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Subscribe'}
            </button>
          </form>
        )}
        {error && (
          <p className="text-sm text-red-500 mt-3">{error}</p>
        )}
      </div>
    </div>
  );
};

export default NewsletterSignup;
