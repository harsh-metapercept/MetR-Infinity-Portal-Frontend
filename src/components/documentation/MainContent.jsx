import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StandardTable from './StandardTable';
import { formatBranchName } from '../../utils/formatBranchName';

const MainContent = ({ currentDoc, allDocs, onDocSelect }) => {
  const { branchName } = useParams();
  const navigate = useNavigate();
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState('');

  // Create slug from text
  const createSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Extract headings from content and assign IDs
  const extractHeadings = (htmlContent) => {
    if (!htmlContent) return [];
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const headingElements = tempDiv.querySelectorAll('h2, h3');
    const extractedHeadings = [];
    const usedIds = new Set();
    
    headingElements.forEach((heading) => {
      const text = heading.textContent.trim();
      const level = heading.tagName.toLowerCase();
      let id = createSlug(text);
      
      // Ensure unique ID
      let counter = 1;
      let finalId = id;
      while (usedIds.has(finalId)) {
        finalId = `${id}-${counter}`;
        counter++;
      }
      usedIds.add(finalId);
      
      extractedHeadings.push({ id: finalId, text, level });
    });
    
    return extractedHeadings;
  };

  // Update headings and SEO metadata when document changes
  useEffect(() => {
    if (!currentDoc) return;
    
    const content = processContent(currentDoc.attributes?.htmlContent || currentDoc.attributes?.content || currentDoc.attributes?.bodyContent);
    const extractedHeadings = extractHeadings(content);
    setHeadings(extractedHeadings);
    
    // Update SEO metadata
    updateSEOMetadata(currentDoc.attributes);
  }, [currentDoc]);
  
  // Update page SEO metadata
  const updateSEOMetadata = (attributes) => {
    if (!attributes) return;
    
    // Update page title
    if (attributes.metaTitle || attributes.htmlTitle || attributes.title) {
      document.title = attributes.metaTitle || attributes.htmlTitle || attributes.title;
    }
    
    // Update or create meta description
    if (attributes.metaDescription) {
      updateMetaTag('description', attributes.metaDescription);
    }
    
    // Update or create meta keywords
    if (attributes.metaKeywords) {
      updateMetaTag('keywords', attributes.metaKeywords);
    }
    
    // Update or create robots tag
    if (attributes.robotsTag) {
      updateMetaTag('robots', attributes.robotsTag);
    }
    
    // Update or create author tag
    if (attributes.authorMetaTag) {
      updateMetaTag('author', attributes.authorMetaTag);
    }
    
    // Update or create publisher tag
    if (attributes.publisherMetaTag) {
      updateMetaTag('publisher', attributes.publisherMetaTag);
    }
    
    // Update or create canonical URL
    if (attributes.canonicalURL) {
      updateLinkTag('canonical', attributes.canonicalURL);
    }
  };
  
  // Helper function to update meta tags
  const updateMetaTag = (name, content) => {
    if (!content) return;
    
    let metaTag = document.querySelector(`meta[name="${name}"]`);
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', name);
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', content);
  };
  
  // Helper function to update link tags (like canonical)
  const updateLinkTag = (rel, href) => {
    if (!href) return;
    
    let linkTag = document.querySelector(`link[rel="${rel}"]`);
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', rel);
      document.head.appendChild(linkTag);
    }
    linkTag.setAttribute('href', href);
  };

  // Scroll to heading
  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setActiveHeading(id);
    }
  };

  // Handle clicks on internal document links
  const handleContentClick = (e) => {
    const target = e.target.closest('a[data-internal-link]');
    if (target) {
      e.preventDefault();
      const linkHref = target.getAttribute('data-internal-link');
      
      // Extract filename from href
      const filename = linkHref.replace(/^.*\//, '').replace(/^\.\//, '');
      
      // Extract ID number from filename
      const idMatch = filename.match(/(\d+)\.html$/);
      const documentId = idMatch ? idMatch[1] : null;
      
      // Find document by multiple matching strategies
      const targetDoc = allDocs?.find(doc => {
        const docFilename = doc.attributes?.fileName || '';
        const docTitle = (doc.attributes?.htmlTitle || doc.attributes?.title || '').toLowerCase();
        
        // Try exact filename match
        if (docFilename.toLowerCase() === filename.toLowerCase()) {
          return true;
        }
        
        // Try ID match
        if (documentId && docFilename === `${documentId}.html`) {
          return true;
        }
        
        // Try title-based matching
        const cleanLinkTitle = filename.replace(/\.html$/, '').replace(/[-_]/g, ' ').toLowerCase();
        const cleanDocTitle = docTitle.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        if (cleanDocTitle && cleanLinkTitle.includes(cleanDocTitle.substring(0, 20))) {
          return true;
        }
        
        // Try partial filename match
        const linkBase = filename.replace(/\.html$/, '').toLowerCase();
        const docBase = docFilename.replace(/\.html$/, '').toLowerCase();
        if (linkBase.includes(docBase) || docBase.includes(linkBase)) {
          return true;
        }
        
        return false;
      });
      
      if (targetDoc) {
        onDocSelect(targetDoc.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };
  // Process HTML content for clean rendering
  const processContent = (htmlContent) => {
    if (!htmlContent) return '';
    
    try {
      // Create temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Remove navigation, index, and unwanted elements
      const unwantedElements = tempDiv.querySelectorAll(`
        nav, .nav, [role="toc"], .toc,
        .ditasearch, .searchbox,
        .breadcrumb, .breadcrumbs,
        .header, .footer,
        .sidebar, .navigation,
        .map, ul.map,
        .topicref,
        script, style
      `);
      unwantedElements.forEach(el => el.remove());
      
      // Remove index/table of contents lists
      const indexLists = tempDiv.querySelectorAll('ul li a[href*=".html"]');
      indexLists.forEach(link => {
        const listItem = link.closest('li');
        const parentList = link.closest('ul');
        if (listItem && parentList && parentList.children.length <= 10) {
          // If it's a small list with HTML links, likely an index - remove the whole list
          parentList.remove();
        }
      });
      
      // Remove any remaining navigation-like lists
      const navLists = tempDiv.querySelectorAll('ul');
      navLists.forEach(list => {
        const links = list.querySelectorAll('a[href*=".html"]');
        if (links.length > 3) {
          // If list has many HTML file links, it's likely navigation
          list.remove();
        }
      });
      
      // Remove ALL h1 tags from content (we'll show title separately)
      const h1Elements = tempDiv.querySelectorAll('h1');
      h1Elements.forEach(h1 => h1.remove());
      
      // Extract main content
      let mainContent = tempDiv.querySelector('main[role="main"], article, .main-content, body');
      if (!mainContent) {
        mainContent = tempDiv;
      }
      
      let processedHtml = mainContent.innerHTML;
      
      // Fix image paths
      const strapiUrl = import.meta.env.VITE_STRAPI_URL;
      processedHtml = processedHtml.replace(
        /src="([^"]*\.(jpg|jpeg|png|gif|svg))"/gi,
        (match, imagePath) => {
          if (imagePath.startsWith('http')) return match;
          if (imagePath.startsWith('/uploads')) return `src="${strapiUrl}${imagePath}"`;
          if (imagePath.includes('media/') || !imagePath.startsWith('/')) {
            return `src="${strapiUrl}/uploads/${imagePath.replace(/^.*\//, '')}"`;
          }
          return `src="${strapiUrl}/uploads/${imagePath}"`;
        }
      );
      
      return processedHtml;
    } catch (error) {
      console.error('Error processing content:', error);
      return htmlContent;
    }
  };
  
  // Process and render content with proper styling for all elements
  const renderStyledContent = (htmlContent) => {
    if (!htmlContent) return null;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Style all ul elements
    const ulElements = tempDiv.querySelectorAll('ul');
    ulElements.forEach(ul => {
      ul.className = 'list-disc list-outside ml-6 my-4 space-y-2';
    });
    
    // Style all ol elements
    const olElements = tempDiv.querySelectorAll('ol');
    olElements.forEach(ol => {
      ol.className = 'list-decimal list-outside ml-6 my-4 space-y-2';
    });
    
    // Style all li elements
    const liElements = tempDiv.querySelectorAll('li');
    liElements.forEach(li => {
      li.className = 'text-gray-700 leading-relaxed pl-2';
    });
    
    // Style and assign IDs to headings based on text content
    const headingElements = tempDiv.querySelectorAll('h2, h3');
    const usedIds = new Set();
    
    headingElements.forEach((heading) => {
      const text = heading.textContent.trim();
      const level = heading.tagName.toLowerCase();
      let id = createSlug(text);
      
      // Ensure unique ID
      let counter = 1;
      let finalId = id;
      while (usedIds.has(finalId)) {
        finalId = `${id}-${counter}`;
        counter++;
      }
      usedIds.add(finalId);
      
      // Assign ID and styling
      heading.id = finalId;
      
      if (level === 'h2') {
        heading.className = 'text-2xl font-semibold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2';
      } else if (level === 'h3') {
        heading.className = 'text-xl font-semibold text-gray-900 mt-6 mb-3';
      }
    });
    
    // Style all h4 elements
    const h4Elements = tempDiv.querySelectorAll('h4');
    h4Elements.forEach(h4 => {
      h4.className = 'text-lg font-semibold text-gray-900 mt-5 mb-2';
    });
    
    // Style all h5 elements
    const h5Elements = tempDiv.querySelectorAll('h5');
    h5Elements.forEach(h5 => {
      h5.className = 'text-base font-semibold text-gray-900 mt-4 mb-2';
    });
    
    // Style all p elements
    const pElements = tempDiv.querySelectorAll('p');
    pElements.forEach(p => {
      p.className = 'text-gray-700 leading-relaxed mb-4';
    });
    
    // Style all strong/b elements
    const strongElements = tempDiv.querySelectorAll('strong, b');
    strongElements.forEach(strong => {
      strong.className = 'font-semibold text-gray-900';
    });
    
    // Style all em/i elements
    const emElements = tempDiv.querySelectorAll('em, i');
    emElements.forEach(em => {
      em.className = 'italic text-gray-700';
    });
    
    // Style all code elements (inline)
    const codeElements = tempDiv.querySelectorAll('code');
    codeElements.forEach(code => {
      if (!code.parentElement || code.parentElement.tagName !== 'PRE') {
        code.className = 'bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono';
      }
    });
    
    // Style all pre elements (code blocks)
    const preElements = tempDiv.querySelectorAll('pre');
    preElements.forEach(pre => {
      pre.className = 'bg-gray-900 text-white p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono';
    });
    
    // Style all blockquote elements
    const blockquoteElements = tempDiv.querySelectorAll('blockquote');
    blockquoteElements.forEach(blockquote => {
      blockquote.className = 'border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-gray-700 bg-gray-50';
    });
    
    // Style and handle all a elements
    const aElements = tempDiv.querySelectorAll('a');
    aElements.forEach(a => {
      a.className = 'text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer';
      
      // Handle ALL links - both href and existing data-internal-link
      const href = a.getAttribute('href');
      const existingLink = a.getAttribute('data-internal-link');
      
      if ((href && href.includes('.html')) || (existingLink && existingLink.includes('.html'))) {
        // Remove all attributes that cause new tab opening
        a.removeAttribute('href');
        a.removeAttribute('target');
        a.removeAttribute('rel');
        
        // Set our internal link data
        const linkToUse = existingLink || href;
        a.setAttribute('data-internal-link', linkToUse);
        a.style.cursor = 'pointer';
      }
    });
    
    // Style all img elements
    const imgElements = tempDiv.querySelectorAll('img');
    imgElements.forEach(img => {
      img.className = 'max-w-full w-full h-auto mx-auto my-6 rounded-lg shadow-md max-h-96 object-contain';
    });
    
    // Style notes, warnings, and special content blocks
    const noteElements = tempDiv.querySelectorAll('.note, [class*="note"], .warning, [class*="warning"], .caution, [class*="caution"], .tip, [class*="tip"], .important, [class*="important"]');
    noteElements.forEach(element => {
      const className = element.className.toLowerCase();
      let bgColor, borderColor, iconSvg, textColor;
      
      if (className.includes('warning') || className.includes('caution')) {
        bgColor = 'bg-yellow-50';
        borderColor = 'border-yellow-400';
        textColor = 'text-yellow-800';
        iconSvg = '<svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
      } else if (className.includes('important')) {
        bgColor = 'bg-red-50';
        borderColor = 'border-red-400';
        textColor = 'text-red-800';
        iconSvg = '<svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
      } else if (className.includes('tip')) {
        bgColor = 'bg-green-50';
        borderColor = 'border-green-400';
        textColor = 'text-green-800';
        iconSvg = '<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>';
      } else {
        // Default note styling
        bgColor = 'bg-blue-50';
        borderColor = 'border-blue-400';
        textColor = 'text-blue-800';
        iconSvg = '<svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>';
      }
      
      element.className = `${bgColor} ${borderColor} ${textColor} border-l-4 p-4 my-4 rounded-r-lg`;
      
      // Add icon if not already present
      if (!element.querySelector('svg')) {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'flex items-start gap-3';
        iconDiv.innerHTML = `${iconSvg}<div class="flex-1">${element.innerHTML}</div>`;
        element.innerHTML = iconDiv.outerHTML;
      }
    });
    
    const styledHtml = tempDiv.innerHTML;
    
    // Split content by tables and render with StandardTable component
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    const tables = styledHtml.match(tableRegex) || [];
    const textParts = styledHtml.split(tableRegex);
    
    const elements = [];
    
    textParts.forEach((textPart, index) => {
      if (textPart.trim()) {
        elements.push(
          <div 
            key={`text-${index}`}
            dangerouslySetInnerHTML={{ __html: textPart }}
          />
        );
      }
      
      if (tables[index]) {
        elements.push(
          <StandardTable 
            key={`table-${index}`}
            tableHtml={tables[index]}
          />
        );
      }
    });
    
    return elements;
  };
  
  if (!currentDoc) {
    return (
      <div className="flex-1 p-8 bg-white">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-gray-500">Select a document to view its content</p>
        </div>
      </div>
    );
  }
  
  const { attributes } = currentDoc;
  const processedContent = processContent(attributes?.htmlContent || attributes?.content || attributes?.bodyContent);
  const contentElements = renderStyledContent(processedContent);
  
  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-white min-w-0 overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-auto">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 overflow-x-auto">
            <button 
              onClick={() => navigate('/')}
              className="hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              Home
            </button>
            <span>/</span>
            <button 
              onClick={() => navigate(`/documentation/${branchName}`)}
              className="hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              {formatBranchName(branchName) || 'Documentation'}
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">
              {attributes?.htmlTitle || attributes?.title || 'Current Page'}
            </span>
          </nav>
        </div>

        {/* Page Title - Only show once here */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#101828] mb-6 sm:mb-8 border-b border-gray-200 pb-4">
          {attributes?.htmlTitle || attributes?.title || 'Untitled Document'}
        </h1>

        {/* Document Content */}
        <div className="w-full max-w-none lg:max-w-4xl overflow-x-auto">
          <div 
            className="documentation-content min-w-0"
            onClick={handleContentClick}
          >
            {contentElements}
          </div>
          
          {/* Next/Previous Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            {(() => {
              if (!allDocs || allDocs.length === 0) return null;
              
              const nonIndexDocs = allDocs.filter(doc => 
                doc.attributes?.fileName?.toLowerCase() !== 'index.html'
              );
              const currentIndex = nonIndexDocs.findIndex(doc => doc.id === currentDoc?.id);
              const prevDoc = currentIndex > 0 ? nonIndexDocs[currentIndex - 1] : null;
              const nextDoc = currentIndex < nonIndexDocs.length - 1 ? nonIndexDocs[currentIndex + 1] : null;
              
              return (
                <>
                  <div className="flex-1 w-full sm:w-auto">
                    {prevDoc && (
                      <button
                        onClick={() => onDocSelect(prevDoc.id)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors group w-full sm:w-auto"
                      >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <div className="text-left min-w-0">
                          <div className="text-xs text-gray-500 uppercase tracking-wider">Previous</div>
                          <div className="font-medium text-sm sm:text-base truncate">{prevDoc.attributes?.htmlTitle || prevDoc.attributes?.title || 'Previous Page'}</div>
                        </div>
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 text-left sm:text-right w-full sm:w-auto">
                    {nextDoc && (
                      <button
                        onClick={() => onDocSelect(nextDoc.id)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors group ml-0 sm:ml-auto w-full sm:w-auto justify-start sm:justify-end"
                      >
                        <div className="text-left sm:text-right min-w-0 order-2 sm:order-1">
                          <div className="text-xs text-gray-500 uppercase tracking-wider">Next</div>
                          <div className="font-medium text-sm sm:text-base truncate">{nextDoc.attributes?.htmlTitle || nextDoc.attributes?.title || 'Next Page'}</div>
                        </div>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0 order-1 sm:order-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </main>

      {/* Table of Contents - Right Sidebar - Hidden on mobile */}
      {headings.length > 0 && (
        <aside className="hidden xl:block w-64 p-6 border-l border-gray-200 sticky top-0 h-screen overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">On This Page</h3>
          <nav className="space-y-2">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={`block w-full text-left text-sm transition-colors ${
                  heading.level === 'h3' ? 'pl-4' : ''
                } ${
                  activeHeading === heading.id
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {heading.text}
              </button>
            ))}
          </nav>
        </aside>
      )}
    </div>
  );
};

export default MainContent;