import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assets/images/Logo.png';
import { documentationAPI } from '../../utils/documentationAPI';
import { formatBranchName } from '../../utils/formatBranchName';

const Header = ({ currentDoc }) => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const currentBranch = currentDoc?.attributes?.branch;

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await documentationAPI.getAllRepositories();
        setModules(response.data || []);
      } catch (err) {
        console.error('Error fetching modules:', err);
      }
    };
    fetchModules();
  }, []);

  const handleModuleChange = (branchName) => {
    navigate(`/documentation/${branchName}`);
    setShowDropdown(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="MetR Logo" className="w-10 h-10 object-contain" />
            <span className="font-bold text-2xl text-neutral-950">
              {formatBranchName(currentBranch) || 'MetR Infinity'}
            </span>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            <a href="/" className="text-[#364153] hover:text-[#266EF6] transition-colors">Home</a>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-[#364153] hover:text-[#266EF6] transition-colors flex items-center gap-1"
              >
                Modules
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {modules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => handleModuleChange(module.attributes?.branch)}
                      className="w-full text-left px-4 py-2 text-sm text-[#364153] hover:bg-gray-50 hover:text-[#266EF6] transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {formatBranchName(module.attributes?.branch)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <a href="#" className="text-[#364153] hover:text-[#266EF6] transition-colors">Contact</a>
          </nav>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search"
            className="w-96 h-[42px] pl-10 pr-4 border border-gray-200 rounded-lg text-sm"
          />
          <div className="absolute left-3 top-3 w-4 h-4">
            <svg fill="none" viewBox="0 0 16 16" className="w-full h-full">
              <path d="M14 14L11.1067 11.1067" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="7.33333" cy="7.33333" r="5.33333" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;