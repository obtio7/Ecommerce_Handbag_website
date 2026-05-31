import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NewsletterSignup from './NewsletterSignup';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation with scroll to top, even if already on the same page
  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    // If we're already on the collection page, force a refresh by navigating away and back
    if (location.pathname === '/collection') {
      // Clear any existing search params and scroll to top
      navigate(path, { replace: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      navigate(path);
    }
  };

  return (
    <footer className="bg-secondary text-primary py-16 md:py-32 px-4 mt-20 border-t border-border-tan/30">
      <div className="max-w-7xl mx-auto">
        {/* Brand Section - Always on top for mobile */}
        <div className="mb-12 md:mb-0 md:hidden text-center">
          <h2 className="text-2xl font-serif tracking-tighter font-bold mb-2">ZAREVIELLE</h2>
          <p className="text-xs italic font-serif text-black/60">Crafted for the everyday extraordinary</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
          {/* Brand - Desktop only */}
          <div className="hidden md:block col-span-1">
            <h2 className="text-3xl font-serif tracking-tighter font-bold mb-4">ZAREVIELLE</h2>
            <p className="text-xs italic font-serif text-black/60 mb-6">Crafted for the everyday extraordinary</p>
            <p className="text-[10px] md:text-[11px] text-black leading-loose uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium max-w-xs">
              Refined objects for the deliberate collector. Sustainability through longevity and craftsmanship.
            </p>
          </div>
          
          {/* Shop Pieces */}
          <div>
            <h4 className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold mb-4 md:mb-8 text-primary">Shop</h4>
            <ul className="text-[10px] md:text-[11px] space-y-3 md:space-y-5 uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium text-text-dark/80">
              <li><a href="/collection" onClick={handleNavigation('/collection')} className="hover:text-primary transition-colors cursor-pointer">Complete Archive</a></li>
              <li><a href="/collection?category=Best Sellers" onClick={handleNavigation('/collection?category=Best Sellers')} className="hover:text-primary transition-colors cursor-pointer">Best Sellers</a></li>
              <li><a href="/collection?category=Carryalls" onClick={handleNavigation('/collection?category=Carryalls')} className="hover:text-primary transition-colors cursor-pointer">Carryalls</a></li>
              <li><a href="/collection?category=Clutches" onClick={handleNavigation('/collection?category=Clutches')} className="hover:text-primary transition-colors cursor-pointer">Clutches</a></li>
            </ul>
          </div>
          
          {/* Information */}
          <div>
            <h4 className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold mb-4 md:mb-8 text-primary">Info</h4>
            <ul className="text-[10px] md:text-[11px] space-y-3 md:space-y-5 uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium text-text-dark/80">
              <li><Link to="/return-policy" className="hover:text-primary transition-colors">Returns</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          {/* Contact & Newsletter */}
          <div className="col-span-2 md:col-span-1 mt-4 md:mt-0">
            <h4 className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold mb-4 md:mb-8 text-primary">Get in Touch</h4>
            <div className="space-y-3 md:space-y-5 text-[10px] md:text-[11px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium text-text-dark/80">
              <p>Phone: 9535770750</p>
              <p>Email: contact@zarevielle.com</p>
            </div>
            <div className="mt-6 md:mt-8">
              <NewsletterSignup variant="footer" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-12 md:mt-32 pt-8 md:pt-10 border-t border-border-tan/20 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
        <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-black font-bold text-center">
          © 2026 Zarevielle Studio. All Rights Reserved.
        </p>
        <div className="flex gap-6 md:gap-10 text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-black font-bold">
          <a href="#" className="hover:text-primary transition-colors">Instagram</a>
          <a href="#" className="hover:text-primary transition-colors">Pinterest</a>
          <a href="#" className="hover:text-primary transition-colors">Journal</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
