import React, { useState } from 'react';

const DropdownNavSection = ({ title, links, onDocSelect, hasSubItems = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMainClick = () => {
    if (hasSubItems) {
      setIsOpen(!isOpen);
    } else if (links.length > 0 && links[0].docId) {
      onDocSelect(links[0].docId);
    }
  };

  return (
    <div className="mb-1">
      {/* Main Section Header */}
      <div 
        className="flex items-center justify-between cursor-pointer py-2 transition-colors"
        onClick={handleMainClick}
      >
        <span className="text-lg font-normal text-[#101828] hover:text-[#799ef2] transition-colors">
          {title}
        </span>
        {hasSubItems && (
          <svg 
            className={`w-4 h-4 text-[#4a5565] transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>

      {/* Dropdown Links */}
      {hasSubItems && isOpen && (
        <div className="ml-4 space-y-1 mb-4">
          {links.map((link, index) => (
            <button
              key={index}
              onClick={() => link.docId && onDocSelect(link.docId)}
              className={`block w-full text-left py-1 text-base transition-colors ${
                link.active 
                  ? 'text-[#799ef2]' 
                  : 'text-[#4a5565] hover:text-[#799ef2]'
              }`}
            >
              {link.name}
            </button>
          ))}
        </div>
      )}
      
      {/* Single item without dropdown */}
      {!hasSubItems && links.length === 1 && (
        <div className="ml-4 mb-2">
          <button
            onClick={() => links[0].docId && onDocSelect(links[0].docId)}
            className={`block w-full text-left py-1 text-base transition-colors ${
              links[0].active 
                ? 'text-[#799ef2]' 
                : 'text-[#4a5565] hover:text-[#799ef2]'
            }`}
          >
            {links[0].name}
          </button>
        </div>
      )}
    </div>
  );
};

export default DropdownNavSection;