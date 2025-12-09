import React from 'react';

const ResourceCard = ({ icon, title, articles, description }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 flex items-center justify-center">
          <span className="text-[#F2C9DC]">{icon}</span>
        </div>
        <h3 className="text-base font-bold text-[rgba(246,51,154,0.4)]">{title}</h3>
        <span className="text-gray-400">—</span>
        <span className="text-sm text-[#99a1af]">{articles}</span>
      </div>
      <p className="text-sm text-[#4a5565] leading-relaxed">{description}</p>
    </div>
  );
};

export default ResourceCard;