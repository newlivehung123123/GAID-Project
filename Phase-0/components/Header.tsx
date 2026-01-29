import React from 'react';

interface HeaderProps {
  onNavClick: (section: string) => void;
  onSearchClick?: () => void;
  onSubscribeClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavClick, onSearchClick, onSubscribeClick }) => {
  return (
    <header className="w-full flex flex-col font-sans relative z-40">
      {/* Top utility bar */}
      <div className="bg-brand-dark border-b border-gray-800 py-1 px-4 sm:px-8 flex justify-between items-center text-xs text-gray-400">
        <div className="flex gap-4">
          <button 
            onClick={onSubscribeClick}
            className="cursor-pointer hover:text-white transition-colors hover:text-blue-400 focus:outline-none uppercase tracking-wider font-semibold"
          >
            Subscribe
          </button>
        </div>
        <div className="flex gap-4">
          <span className="uppercase tracking-wider">Global Edition</span>
        </div>
      </div>

      {/* Main Brand Header */}
      <div className="bg-black py-6 px-4 sm:px-8 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex justify-center items-center relative">
          <h1 
            onClick={() => onNavClick('home')}
            className="font-orbitron text-3xl sm:text-5xl font-bold text-white tracking-tight text-center z-10 cursor-pointer hover:opacity-90 transition-opacity"
          >
            AI <span className="text-white mx-1 text-2xl sm:text-4xl italic">IN</span> SOCIETY
          </h1>
          
          <div className="hidden md:flex space-x-2 absolute right-0">
             {/* Search Icon / Action */}
            <div 
              onClick={onSearchClick}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 cursor-pointer flex items-center justify-center text-white transition-colors group"
              role="button"
              aria-label="Search"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-brand-dark sticky top-0 z-50 shadow-md border-b border-gray-700 backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <ul className="flex flex-wrap justify-center gap-6 sm:gap-8 py-3 text-sm font-semibold tracking-wide uppercase text-gray-300">
            <li>
              <button 
                onClick={() => onNavClick('articles')}
                className="hover:text-blue-400 hover:border-b-2 border-blue-400 pb-1 transition-all"
              >
                Articles
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavClick('opportunities')}
                className="hover:text-blue-400 hover:border-b-2 border-blue-400 pb-1 transition-all"
              >
                AI Opportunities Board
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavClick('books')}
                className="hover:text-blue-400 hover:border-b-2 border-blue-400 pb-1 transition-all"
              >
                AI Must-Read Books
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;