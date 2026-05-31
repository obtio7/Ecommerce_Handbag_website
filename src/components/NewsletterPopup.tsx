import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import NewsletterSignup from './NewsletterSignup';

const POPUP_DELAY = 15000; // 15 seconds
const STORAGE_KEY = 'zarevielle_newsletter_popup_shown';
const POPUP_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const POPUP_ENABLED = false; // Set to true to enable popup

const NewsletterPopup: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if popup is enabled
    if (!POPUP_ENABLED) return;
    
    // Check if popup was recently shown
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown) {
      const timeSinceLastShown = Date.now() - parseInt(lastShown, 10);
      if (timeSinceLastShown < POPUP_COOLDOWN) {
        return; // Don't show popup if shown within cooldown period
      }
    }

    // Show popup after delay
    const timer = setTimeout(() => {
      setShowPopup(true);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }, POPUP_DELAY);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowPopup(false);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <NewsletterSignup variant="popup" onClose={handleClose} />
      )}
    </AnimatePresence>
  );
};

export default NewsletterPopup;
