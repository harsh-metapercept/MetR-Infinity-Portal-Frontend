import React from 'react';
import DropdownNavSection from './DropdownNavSection';

const TestSidebar = ({ onDocSelect }) => {
  // Test data based on your index.html structure
  const testNavigation = [
    {
      title: "FSC and PRS Support Escalation Procedure",
      hasSubItems: true,
      links: [
        { name: "Purpose", docId: null, active: false },
        { name: "Application", docId: null, active: false },
        { name: "References", docId: null, active: false },
        { name: "Definitions", docId: null, active: false },
        { name: "Procedure", docId: null, active: false },
        { name: "Collaboration", docId: null, active: false },
        { name: "Revision History", docId: null, active: false }
      ]
    },
    {
      title: "Cyberattack Response",
      hasSubItems: true,
      links: [
        { name: "Purpose", docId: null, active: false },
        { name: "Application", docId: null, active: false },
        { name: "References", docId: null, active: false },
        { name: "Procedure", docId: null, active: false },
        { name: "Collaboration", docId: null, active: false },
        { name: "Revision History", docId: null, active: false }
      ]
    },
    {
      title: "IDS All-Inverter Systems",
      hasSubItems: true,
      links: [
        { name: "Purpose", docId: null, active: false },
        { name: "Reference", docId: null, active: false },
        { name: "Procedure", docId: null, active: false },
        { name: "Approval", docId: null, active: false },
        { name: "Revision History", docId: null, active: false }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#fbf8f8] h-screen overflow-y-auto p-6">
      <div className="mb-4 p-2 bg-yellow-100 text-xs">
        TEST SIDEBAR - Expected Structure
      </div>
      <nav className="space-y-6">
        {testNavigation.map((navItem, index) => (
          <DropdownNavSection
            key={index}
            title={navItem.title}
            links={navItem.links}
            hasSubItems={navItem.hasSubItems}
            onDocSelect={onDocSelect}
          />
        ))}
      </nav>
    </aside>
  );
};

export default TestSidebar;