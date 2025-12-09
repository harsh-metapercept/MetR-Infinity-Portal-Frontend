import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './documentation/Header';
import Sidebar from './documentation/Sidebar';
import MainContent from './documentation/MainContent';
import Footer from './documentation/Footer';
import { documentationAPI } from '../utils/documentationAPI';

const Documentation = () => {
  const { branchName } = useParams();
  const [allDocs, setAllDocs] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch documentation filtered by branch name
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        let response;
        
        if (branchName) {
          // Fetch docs for specific branch
          console.log('Fetching docs for branch:', branchName);
          response = await documentationAPI.getDocsByRepository(branchName);
        } else {
          // Fetch all docs if no branch specified
          response = await documentationAPI.getAllDocs();
        }
        
        setAllDocs(response.data || []);
        
        // Set first non-index document as default
        if (response.data && response.data.length > 0) {
          const firstDoc = response.data.find(doc => 
            doc.attributes?.fileName?.toLowerCase() !== 'index.html'
          ) || response.data[0];
          setCurrentDoc(firstDoc);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching documentation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [branchName]);

  // Function to handle document selection
  const handleDocSelect = async (docId) => {
    try {
      const response = await documentationAPI.getDocById(docId);
      setCurrentDoc(response.data);
    } catch (err) {
      console.error('Error fetching document:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#fbf8f8] flex items-center justify-center">
        <div className="text-lg">Loading documentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#fbf8f8] flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#fbf8f8]">
      <div className="bg-[#fbf8f8] relative min-h-screen w-full max-w-[1440px] mx-auto">
        <Header currentDoc={currentDoc} />
        <div className="flex">
          <Sidebar allDocs={allDocs} currentDoc={currentDoc} onDocSelect={handleDocSelect} />
          <MainContent currentDoc={currentDoc} />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Documentation;