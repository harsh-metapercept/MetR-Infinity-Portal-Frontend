import React from 'react';

const FooterColumn = ({ title, links }) => {
  return (
    <div className="w-44">
      <h4 className="text-2xl font-bold text-[#3d3e3f] mb-6">{title}</h4>
      <ul className="space-y-3">
        {links.map((link, index) => (
          <li key={index}>
            <a href="#" className="text-base text-[#3d3e3f] hover:text-[#266EF6] transition-colors">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterColumn;