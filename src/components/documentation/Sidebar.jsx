import React, { useState, useEffect } from 'react';
import { documentationAPI } from '../../utils/documentationAPI';

const Sidebar = ({ allDocs, currentDoc, onDocSelect }) => {
  const [navigationStructure, setNavigationStructure] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [loading, setLoading] = useState(true);

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Find index.html file dynamically
  const findIndexFile = () => {
    if (!allDocs || allDocs.length === 0) return null;
    
    const indexFile = allDocs.find(doc => {
      const fileName = doc.attributes?.fileName || '';
      return fileName.toLowerCase() === 'index.html';
    });
    
    return indexFile;
  };

  // Parse navigation structure from index.html file with nested items
  const parseIndexNavigation = async () => {
    try {
      const indexFile = findIndexFile();
      if (!indexFile) {
        console.log('No index file found');
        return generateSimpleNavigation();
      }
      
      console.log('Using index file ID:', indexFile.id);
      const indexDoc = await documentationAPI.getDocById(indexFile.id);
      
      const htmlContent = indexDoc.data?.attributes?.htmlContent || 
                         indexDoc.data?.attributes?.content || 
                         indexDoc.data?.attributes?.html || 
                         indexDoc.data?.attributes?.body || 
                         '';
      
      if (!htmlContent) {
        console.log('No HTML content found');
        return generateSimpleNavigation();
      }
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const navElement = doc.querySelector('nav ul.map');
      
      if (!navElement) {
        return generateSimpleNavigation();
      }
      
      const navigationStructure = [];
      const mainItems = navElement.querySelectorAll('> li.topicref');
      
      mainItems.forEach(mainItem => {
        const mainLink = mainItem.querySelector('> a');
        if (!mainLink) return;
        
        const title = mainLink.textContent.trim();
        const docId = findDocIdByTitle(title);
        
        // Check for sub-items
        const subList = mainItem.querySelector('> ul');
        const hasSubItems = subList && subList.children.length > 0;
        
        const navItem = {
          title,
          docId,
          hasSubItems,
          active: currentDoc?.id === docId,
          subItems: []
        };
        
        if (hasSubItems) {
          const subItems = subList.querySelectorAll('> li.topicref > a');
          subItems.forEach(subLink => {
            const subTitle = subLink.textContent.trim();
            const subDocId = findDocIdByTitle(subTitle);
            navItem.subItems.push({
              name: subTitle,
              docId: subDocId,
              active: currentDoc?.id === subDocId
            });
          });
        }
        
        navigationStructure.push(navItem);
      });
      
      return navigationStructure;
    } catch (error) {
      console.error('Error parsing index navigation:', error);
      return generateSimpleNavigation();
    }
  };
  
  // Simple navigation from all documents
  const generateSimpleNavigation = () => {
    if (!allDocs || allDocs.length === 0) return [];
    
    const nonIndexDocs = allDocs.filter(doc => {
      const fileName = doc.attributes?.fileName || '';
      return fileName.toLowerCase() !== 'index.html';
    });
    
    return nonIndexDocs.map(doc => ({
      title: doc.attributes?.htmlTitle || doc.attributes?.title || `Document ${doc.id}`,
      docId: doc.id,
      hasSubItems: false,
      active: currentDoc?.id === doc.id,
      subItems: []
    }));
  };
  
  // Find document ID by title
  const findDocIdByTitle = (title) => {
    if (!allDocs || allDocs.length === 0) return null;
    
    const doc = allDocs.find(doc => {
      const docTitle = doc.attributes?.htmlTitle || doc.attributes?.title || '';
      return docTitle.toLowerCase().includes(title.toLowerCase()) || 
             title.toLowerCase().includes(docTitle.toLowerCase());
    });
    
    return doc?.id || null;
  };
  
  // Load navigation structure
  useEffect(() => {
    const loadNavigation = async () => {
      try {
        setLoading(true);
        const nav = await parseIndexNavigation();
        setNavigationStructure(nav);
      } catch (error) {
        console.error('Error loading navigation:', error);
        setNavigationStructure([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (allDocs && allDocs.length > 0) {
      loadNavigation();
    }
  }, [allDocs, currentDoc]);
  
  if (loading) {
    return (
      <aside className="w-64 bg-[#fbf8f8] h-screen overflow-y-auto p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading navigation...</div>
        </div>
      </aside>
    );
  }
  
  return (
    <aside className="w-72 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Documentation</h2>
        <nav className="space-y-1">
          {navigationStructure.map((navItem, index) => (
            <div key={index}>
              {/* Main Item */}
              <div className="flex items-center">
                <button
                  onClick={() => {
                    if (navItem.hasSubItems) {
                      toggleExpand(index);
                    }
                    if (navItem.docId) {
                      onDocSelect(navItem.docId);
                    }
                  }}
                  className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    navItem.active 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {/* Icon */}
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  
                  <span className="flex-1 text-left">{navItem.title}</span>
                  
                  {/* Dropdown Arrow */}
                  {navItem.hasSubItems && (
                    <svg 
                      className={`w-4 h-4 transition-transform ${
                        expandedItems[index] ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Sub Items */}
              {navItem.hasSubItems && expandedItems[index] && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                  {navItem.subItems.map((subItem, subIndex) => (
                    <button
                      key={subIndex}
                      onClick={() => subItem.docId && onDocSelect(subItem.docId)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        subItem.active
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-left">{subItem.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;