import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-32">
      {/* Hero Section */}
      <div className="text-center mb-24">
        <h1 className="text-6xl md:text-8xl font-serif tracking-tighter mb-6">
          Our <span className="italic font-light">Story</span>
        </h1>
        <p className="text-lg text-black/70 max-w-2xl mx-auto italic font-serif leading-relaxed">
          "Crafted for the everyday extraordinary"
        </p>
      </div>

      {/* Brand Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-32">
        <div className="space-y-8">
          <h2 className="text-3xl font-serif tracking-tighter text-primary">The Beginning</h2>
          <p className="text-sm text-black/70 leading-relaxed">
            Zarevielle was born from a simple belief — that everyday accessories should carry the same 
            intention and craft as the moments they accompany. We design handbags that move with you, 
            from morning meetings to evening gatherings, without compromise.
          </p>
          <p className="text-sm text-black/70 leading-relaxed">
            Each piece in our collection is thoughtfully designed and meticulously crafted, using 
            materials sourced from the finest tanneries. We believe luxury isn't about excess — 
            it's about choosing fewer, better things.
          </p>
        </div>
        <div className="aspect-[4/5] bg-surface rounded-[40px] overflow-hidden border border-border-tan/30 card-shadow">
          <img 
            src="https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80" 
            alt="Artisan crafting leather"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Values */}
      <div className="mb-32">
        <h2 className="text-4xl font-serif tracking-tighter text-center mb-16">What We <span className="italic font-light">Stand For</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-serif text-primary">01</span>
            </div>
            <h3 className="text-lg font-serif text-primary">Quality Materials</h3>
            <p className="text-sm text-black/60 leading-relaxed">
              We source premium leathers from certified tanneries, ensuring every piece ages beautifully with time.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-serif text-primary">02</span>
            </div>
            <h3 className="text-lg font-serif text-primary">Thoughtful Design</h3>
            <p className="text-sm text-black/60 leading-relaxed">
              Every detail serves a purpose. From the weight of a clasp to the depth of a pocket — nothing is accidental.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-serif text-primary">03</span>
            </div>
            <h3 className="text-lg font-serif text-primary">Lasting Value</h3>
            <p className="text-sm text-black/60 leading-relaxed">
              We create pieces meant to last years, not seasons. Sustainability through longevity and timeless design.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-primary text-white py-20 px-8 rounded-[40px]">
        <h2 className="text-4xl font-serif tracking-tighter mb-4">Explore the Collection</h2>
        <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">
          Discover handbags designed for the way you live — elegant, functional, and built to last.
        </p>
        <Link 
          to="/collection" 
          className="inline-block px-10 py-4 bg-white text-primary text-[11px] uppercase tracking-[0.3em] font-bold rounded-full hover:bg-white/90 transition-all"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
};

export default About;
