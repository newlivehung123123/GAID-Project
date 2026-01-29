import React, { useState, useEffect } from 'react';
import { Article } from '../types';

interface HeroSectionProps {
  article: Article;
}

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop", // 1. Global Network (Space/Earth)
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop", // 2. Abstract Chip/Circuits
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop", // 3. Friendly Robot Face (Reliable "Frank" Robot)
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop", // 4. Society/Academic Seminar (Oxford Style)
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2072&auto=format&fit=crop"  // 5. Cyberpunk City
];

const HeroSection: React.FC<HeroSectionProps> = ({ article }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden mb-12 bg-black">
      {/* Background Slideshow */}
      {HERO_IMAGES.map((img, index) => (
        <img 
          key={img}
          src={img} 
          alt={`Futuristic AI Society background ${index + 1}`} 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      
      {/* Overlay Gradient for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10"></div>

      {/* Content Container - Aligned with the rest of the site grid but overlaid on image */}
      <div className="absolute inset-0 flex items-center z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 w-full">
          <div className="max-w-3xl">
            <div 
              className="pl-2 py-2 backdrop-blur-sm bg-black/10 rounded-sm relative group"
            >
              {/* Red Quote Icon */}
              <div className="mb-6">
                 <svg width="48" height="48" viewBox="0 0 24 24" fill="#dc2626" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 7.55228 14.017 7V3H19.017C20.6739 3 22.017 4.34315 22.017 6V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 7.55228 5.0166 7V3H10.0166C11.6735 3 13.0166 4.34315 13.0166 6V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                 </svg>
              </div>
              
              {/* Hardcoded Title */}
              <h1 className="text-4xl md:text-6xl font-orbitron font-bold text-white mb-6 leading-tight drop-shadow-lg group-hover:text-gray-200 transition-colors">
                Navigating How AI Shapes Us and Our Society
              </h1>
              
              {/* Hardcoded Summary */}
              <p className="text-gray-200 text-base md:text-lg leading-relaxed mb-8 font-mono drop-shadow-md max-w-xl group-hover:text-white transition-colors">
                 A non-paywalled site using data, analysis, philosophy and/or more to explore the societal impacts of AI.
              </p>

              {/* Editorial Tag */}
              <div className="flex items-center text-sm text-gray-300 font-medium tracking-wide">
                 <span className="text-white uppercase font-bold tracking-widest text-lg font-orbitron">
                   - Editorial
                 </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom fade for smooth transition to content */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#121212] to-transparent z-10"></div>
    </section>
  );
};

export default HeroSection;