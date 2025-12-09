import React, { useState, useEffect } from 'react';
import StandardTable from './StandardTable';

const MainContent = ({ currentDoc }) => {
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState('');

  // Extract headings from content
  useEffect(() => {
    if (!currentDoc) return;
    
    const content = processContent(currentDoc.attributes?.htmlContent || currentDoc.attributes?.content || currentDoc.attributes?.bodyContent);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const headingElements = tempDiv.querySelectorAll('h2, h3');
    const extractedHeadings = [];
    
    headingElements.forEach((heading, index) => {
      const id = `heading-${index}`;
      const text = heading.textContent.trim();
      const level = heading.tagName.toLowerCase();
      
      extractedHeadings.push({ id, text, level });
    });
    
    setHeadings(extractedHeadings);
  }, [currentDoc]);

  // Scroll to heading
  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeading(id);
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
    
    // Style all h2 elements and add IDs
    const h2Elements = tempDiv.querySelectorAll('h2');
    h2Elements.forEach((h2, index) => {
      h2.className = 'text-2xl font-semibold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2';
      h2.id = `heading-${headings.findIndex(h => h.text === h2.textContent.trim() && h.level === 'h2')}`;
    });
    
    // Style all h3 elements and add IDs
    const h3Elements = tempDiv.querySelectorAll('h3');
    let h2Count = h2Elements.length;
    h3Elements.forEach((h3, index) => {
      h3.className = 'text-xl font-semibold text-gray-900 mt-6 mb-3';
      h3.id = `heading-${h2Count + index}`;
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
    
    // Style all a elements
    const aElements = tempDiv.querySelectorAll('a');
    aElements.forEach(a => {
      a.className = 'text-blue-600 hover:text-blue-800 hover:underline transition-colors';
    });
    
    // Style all img elements
    const imgElements = tempDiv.querySelectorAll('img');
    imgElements.forEach(img => {
      img.className = 'max-w-full h-auto mx-auto my-6 rounded-lg shadow-md max-h-96 object-contain';
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
    <div className="flex-1 flex bg-white">
      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <span className="text-[#799ef2] text-sm">
            {attributes?.repositoryName || 'Documentation'}
          </span>
        </div>

        {/* Page Title - Only show once here */}
        <h1 className="text-3xl font-bold text-[#101828] mb-8 border-b border-gray-200 pb-4">
          {attributes?.htmlTitle || attributes?.title || 'Untitled Document'}
        </h1>

        {/* Document Content */}
        <div className="max-w-4xl">
          <div className="documentation-content">
            {contentElements}
          </div>
        </div>
      </main>

      {/* Table of Contents - Right Sidebar */}
      {headings.length > 0 && (
        <aside className="w-64 p-6 border-l border-gray-200 sticky top-0 h-screen overflow-y-auto">
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