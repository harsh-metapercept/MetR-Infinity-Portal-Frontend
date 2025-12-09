import React from 'react';

const StandardTable = ({ tableHtml }) => {
  // Parse table HTML and extract data
  const parseTableData = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    
    if (!table) return { headers: [], rows: [] };
    
    const headers = [];
    const rows = [];
    
    // Extract headers
    const headerRow = table.querySelector('thead tr, tr:first-child');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th, td');
      headerCells.forEach(cell => {
        headers.push(cell.textContent.trim());
      });
    }
    
    // Extract rows (skip header row if it was a tr:first-child)
    const bodyRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
    bodyRows.forEach(row => {
      const cells = [];
      const rowCells = row.querySelectorAll('td, th');
      rowCells.forEach(cell => {
        cells.push(cell.innerHTML.trim());
      });
      if (cells.length > 0) rows.push(cells);
    });
    
    return { headers, rows };
  };
  
  const { headers, rows } = parseTableData(tableHtml);
  
  if (headers.length === 0 && rows.length === 0) {
    return <div dangerouslySetInnerHTML={{ __html: tableHtml }} />;
  }
  
  return (
    <div className="my-6 overflow-x-auto">
      <div className="inline-block min-w-full shadow-sm rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          {headers.length > 0 && (
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100 last:border-r-0"
                    dangerouslySetInnerHTML={{ __html: cell }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandardTable;