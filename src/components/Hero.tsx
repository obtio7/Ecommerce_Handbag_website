import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="relative h-[90vh] flex items-center overflow-hidden bg-surface mx-4 mt-4 rounded-[40px] border border-border-tan/30 card-shadow">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1548036657-3f744421b203?q=80&w=2670&auto=format&fit=crop" 
          alt="Luxury Handbag Hero"
          className="w-full h-full object-cover grayscale opacity-30 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/60 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-12 lg:px-20 w-full">
        <div className="max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="w-12 h-px bg-primary opacity-30"></span>
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">
              The Arrival Collection 2026
            </p>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-7xl md:text-[120px] leading-[0.85] font-serif font-bold tracking-tighter mb-10 text-primary"
          >
            ZAREVIELLE
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-black text-lg mb-12 max-w-sm italic leading-relaxed"
          >
            Crafted for the everyday extraordinary.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap gap-6"
          >
            <Link 
              to="/collection" 
              className="px-10 py-5 bg-primary text-white text-[11px] uppercase tracking-widest font-bold rounded-full hover:bg-black transition-all duration-300 shadow-lg"
            >
              Explore Collection
            </Link>

          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 hidden lg:block">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="relative w-32 h-32 flex items-center justify-center border border-primary/10 rounded-full"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-24 h-24 uppercase tracking-[0.2em] text-[8px] fill-primary">
              <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
              <text>
                <textPath xlinkHref="#circlePath" startOffset="0%">Handcrafted Luxury — Premium Materials — Timeless Design — </textPath>
              </text>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

