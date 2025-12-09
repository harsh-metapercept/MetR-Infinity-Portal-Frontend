import React from 'react';

const CTACard = ({ title, description, buttonText }) => {
  return (
    <div className="bg-[#f5e6ed] rounded-lg p-8 relative overflow-hidden">
      <div className="absolute right-8 top-8 w-25 h-25 opacity-20">
        <div className="w-full h-full border-2 border-[#EA95BD] rounded-lg"></div>
      </div>
      <div className="relative z-10">
        <h3 className="text-base font-bold text-[#3d3e3f] mb-4">{title}</h3>
        <p className="text-sm text-[#3d3e3f] mb-6 leading-relaxed">{description}</p>
        <button className="bg-white bg-opacity-50 px-5 py-2 rounded text-sm font-bold text-[#3d3e3f] hover:bg-opacity-70 transition-all">
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default CTACard;