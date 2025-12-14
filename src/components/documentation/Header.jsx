import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../../assets/images/Logo.png';
import { formatBranchName } from '../../utils/formatBranchName';
import { useApp } from '../../context/AppContext';

const Header = ({ currentDoc, sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { openChat, repositories } = useApp();
  const modules = repositories;
  const currentBranch = currentDoc?.attributes?.branch;
  const domain = formatBranchName(currentBranch)?.toLowerCase() || 'general';

  const handleModuleChange = (branchName) => {
    navigate(`/documentation/${branchName}`);
    setShowDropdown(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile hamburger menu */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="MetR Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <span className="font-bold text-lg sm:text-2xl text-neutral-950 truncate">
              {formatBranchName(currentBranch) || 'MetR Infinity'}
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-[#364153] hover:text-[#266EF6] transition-colors">Home</Link>
            <a href="#" className="text-[#364153] hover:text-[#266EF6] transition-colors">Contact</a>
          </nav>
        </div>

        {/* Modules dropdown - visible on all screen sizes */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-[#364153] hover:text-[#266EF6] transition-colors flex items-center gap-1 p-2"
          >
            <span className="hidden sm:inline">Modules</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => handleModuleChange(module.attributes?.branch)}
                    className="w-full text-left px-4 py-2 text-sm text-[#364153] hover:bg-gray-50 hover:text-[#266EF6] transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {formatBranchName(module.attributes?.branch)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search - responsive */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search"
            onClick={() => openChat(domain)}
            readOnly
            className="w-32 sm:w-48 lg:w-96 h-[42px] pl-10 pr-4 border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-[#266EF6] transition-colors"
          />
          <div className="absolute left-3 top-3 w-4 h-4 pointer-events-none">
            <svg fill="none" viewBox="0 0 16 16" className="w-full h-full">
              <path d="M14 14L11.1067 11.1067" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="7.33333" cy="7.33333" r="5.33333" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Mobile search icon */}
        <button className="sm:hidden p-2 rounded-md hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 16 16">
            <path d="M14 14L11.1067 11.1067" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7.33333" cy="7.33333" r="5.33333" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;