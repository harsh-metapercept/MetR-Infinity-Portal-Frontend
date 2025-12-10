import React from 'react';
import logoImg from '../../assets/images/Logo.png';
import FooterColumn from './FooterColumn';

const Footer = () => {
  return (
    <footer className="bg-[#fbf8f8] border-t-2 border-[rgba(246,51,154,0.4)] px-4 sm:px-8 lg:px-28 py-12 sm:py-16 lg:py-24">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-8">
        <div className="w-full lg:w-96">
          <div className="w-24 sm:w-30 h-6 sm:h-8 mb-6 sm:mb-8">
            <img src={logoImg} alt="MetR Logo" className="w-full h-full object-contain" />
          </div>
          <p className="text-sm text-[#3d3e3f]">© 2024 MetR Infinity. All rights reserved</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 w-full">
          <FooterColumn 
            title="Product"
            links={['Overview', 'Features', 'Tutorials', 'Pricing', 'Releases']}
          />
          <FooterColumn 
            title="Company"
            links={['About', 'Press', 'Careers', 'Contact', 'Partners']}
          />
          <FooterColumn 
            title="Support"
            links={['Help Center', 'Terms of service', 'Legal', 'Privacy Policy', 'Status']}
          />
          <FooterColumn 
            title="Follow us"
            links={['Facebook', 'Twitter', 'Dribbble', 'Instagram', 'LinkedIn']}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;