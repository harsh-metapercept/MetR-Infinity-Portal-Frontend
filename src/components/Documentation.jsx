import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './documentation/Header';
import Sidebar from './documentation/Sidebar';
import MainContent from './documentation/MainContent';
import Footer from './documentation/Footer';
import { PageLoader, ErrorDisplay } from './Loader';
import { useDocsByRepository, useAllDocs, useDocById } from '../hooks/useDocumentation';

const Documentation = () => {
  const { branchName } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const { data: docsData, isLoading: loading, error } = branchName
    ? useDocsByRepository(branchName)
    : useAllDocs();

  const allDocs = docsData?.data || [];

  const firstDocId = allDocs.length > 0
    ? (allDocs.find(doc => doc.attributes?.fileName?.toLowerCase() !== 'index.html') || allDocs[0])?.id
    : null;

  const docIdToFetch = selectedDocId || firstDocId;
  const { data: currentDocData } = useDocById(docIdToFetch);
  const currentDoc = currentDocData?.data;

  const handleDocSelect = (docId) => {
    setSelectedDocId(docId);
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#fbf8f8] flex items-center justify-center">
        <ErrorDisplay message={error?.message || 'Failed to load documentation'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full bg-[#fbf8f8] overflow-x-hidden"
    >
      <div className="bg-[#fbf8f8] relative min-h-screen w-full max-w-[1440px] mx-auto">
        <Header currentDoc={currentDoc} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex relative min-h-0">
          <Sidebar
            allDocs={allDocs}
            currentDoc={currentDoc}
            onDocSelect={handleDocSelect}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <MainContent currentDoc={currentDoc} allDocs={allDocs} onDocSelect={handleDocSelect} />
        </div>
        <Footer />
      </div>
    </motion.div>
  );
};

export default Documentation;