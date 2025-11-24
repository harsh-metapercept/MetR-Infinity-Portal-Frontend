import React, { useState } from 'react';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="lg:hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="flex flex-col justify-center items-center w-8 h-8 space-y-1"
        aria-label="Toggle mobile menu"
      >
        <span className={`block w-6 h-0.5 bg-[#3d3e3f] transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
        <span className={`block w-6 h-0.5 bg-[#3d3e3f] transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block w-6 h-0.5 bg-[#3d3e3f] transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={toggleMenu}>
          <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg transform transition-transform duration-300">
            <div className="flex flex-col p-6 space-y-6">
              <button
                onClick={toggleMenu}
                className="self-end text-2xl text-[#3d3e3f]"
                aria-label="Close menu"
              >
                ×
              </button>
              <nav className="flex flex-col space-y-4">
                <a href="#" className="font-semibold text-xl text-[#3d3e3f] hover:text-[#266EF6] transition-colors duration-200" onClick={toggleMenu}>Overview</a>
                <a href="#" className="font-semibold text-xl text-[#3d3e3f] hover:text-[#266EF6] transition-colors duration-200" onClick={toggleMenu}>Features</a>
                <a href="#" className="font-semibold text-xl text-[#3d3e3f] hover:text-[#266EF6] transition-colors duration-200" onClick={toggleMenu}>Pricing</a>
                <a href="#" className="font-semibold text-xl text-[#3d3e3f] hover:text-[#266EF6] transition-colors duration-200" onClick={toggleMenu}>About</a>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;