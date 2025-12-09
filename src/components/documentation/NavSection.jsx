import React from 'react';

const NavSection = ({ title, links, onDocSelect }) => {
  return (
    <div>
      <h3 className="text-lg font-normal text-[#101828] mb-4">{title}</h3>
      <ul className="space-y-1 ml-4">
        {links.map((link, index) => (
          <li key={index}>
            <button 
              onClick={() => link.docId && onDocSelect(link.docId)}
              className={`text-base transition-colors text-left w-full ${
                link.active 
                  ? 'text-[#799ef2]' 
                  : 'text-[#4a5565] hover:text-[#799ef2]'
              }`}
            >
              {link.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NavSection;