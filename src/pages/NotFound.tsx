import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ShoppingBag, ArrowLeft, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-32 text-center"
    >
      {/* Large 404 */}
      <motion.h1 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-[140px] md:text-[200px] font-serif leading-none tracking-tighter text-primary/10 select-none"
      >
        404
      </motion.h1>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 -mt-6"
      >
        <h2 className="font-serif italic text-2xl md:text-3xl text-black">
          Page Not Found
        </h2>
        <p className="text-sm text-black/60 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 mt-10"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 px-8 py-3 border border-border-tan text-black text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:border-primary hover:text-primary transition-all"
        >
          <ArrowLeft size={14} />
          Go Back
        </button>
        <Link
          to="/"
          className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition-all"
        >
          <Home size={14} />
          Home
        </Link>
        <Link
          to="/collection"
          className="flex items-center justify-center gap-2 px-8 py-3 border border-primary text-primary text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-primary hover:text-white transition-all"
        >
          <ShoppingBag size={14} />
          Shop
        </Link>
      </motion.div>

      {/* Helpful links */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-16 pt-8 border-t border-border-tan/30"
      >
        <p className="text-xs text-black/40 uppercase tracking-[0.2em] font-bold mb-4">Popular Pages</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/collection" className="text-sm text-black/60 hover:text-primary transition-colors">Collection</Link>
          <span className="text-black/20">•</span>
          <Link to="/about" className="text-sm text-black/60 hover:text-primary transition-colors">About Us</Link>
          <span className="text-black/20">•</span>
          <Link to="/contact" className="text-sm text-black/60 hover:text-primary transition-colors">Contact</Link>
          <span className="text-black/20">•</span>
          <Link to="/return-policy" className="text-sm text-black/60 hover:text-primary transition-colors">Returns</Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;
