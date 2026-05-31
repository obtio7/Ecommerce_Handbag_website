import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const Success: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-60 flex flex-col items-center text-center space-y-16">
      <motion.div 
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 80 }}
        className="w-32 h-32 bg-primary text-white rounded-full flex items-center justify-center card-shadow"
      >
        <CheckCircle size={64} strokeWidth={1} />
      </motion.div>
      
      <div className="space-y-8">
        <p className="text-[10px] uppercase tracking-[0.6em] font-bold text-primary">Confirmation Authorized</p>
        <h1 className="text-7xl md:text-[120px] font-serif tracking-tighter leading-none text-primary">With Gratitude, <br /> <span className="italic font-light opacity-60">Confirmed.</span></h1>
      </div>
      
      <div className="space-y-12">
        <p className="text-black max-w-lg mx-auto italic text-xl font-serif leading-relaxed">
          Your selection has entered our clinical preparation phase. A confirmation of craft and logistics has been dispatched to your email.
        </p>

        <Link 
          to="/" 
          className="inline-flex items-center gap-6 px-16 py-6 bg-primary text-white text-[11px] uppercase tracking-[0.4em] font-bold rounded-full hover:bg-black transition-all shadow-xl"
        >
          Return to Archive
        </Link>
      </div>
    </div>
  );
};

export default Success;

