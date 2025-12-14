import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppProvider } from './context/AppContext'
import Homepage from './components/Homepage'
import Documentation from './components/Documentation'
import ChatModal from './components/ChatModal'
import LocationModal from './components/LocationModal'
import { useApp } from './context/AppContext'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

function AppContent() {
  const { isChatOpen, chatDomain, closeChat, showLocationModal, handleLocationAllow, handleLocationDeny } = useApp();

  return (
    <>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/documentation/:branchName" element={<Documentation />} />
        <Route path="/documentation" element={<Documentation />} />
      </Routes>
      <ChatModal isOpen={isChatOpen} onClose={closeChat} domain={chatDomain} />
      <LocationModal isOpen={showLocationModal} onAllow={handleLocationAllow} onDeny={handleLocationDeny} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-[#fbf8f8]">
            <AppContent />
          </div>
        </Router>
      </AppProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  )
}

export default App
