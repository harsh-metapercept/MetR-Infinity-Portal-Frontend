import { createContext, useContext, useState, useEffect } from 'react';
import { requestLocationPermission } from '../utils/geoLocation';
import { useRepositories } from '../hooks/useDocumentation';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const PREFIX = import.meta.env.VITE_APP_PREFIX || 'APP';

export const AppProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState({});
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatDomain, setChatDomain] = useState('general');

  const repositoriesQuery = useRepositories();

  useEffect(() => {
    const hasRequestedLocation = localStorage.getItem(`${PREFIX}_locationRequested`);
    const savedLocation = localStorage.getItem(`${PREFIX}_userLocation`);

    if (savedLocation) {
      try {
        setUserLocation(JSON.parse(savedLocation));
      } catch (e) {
        console.error('Failed to parse saved location');
      }
    }

    if (!hasRequestedLocation) {
      setShowLocationModal(true);
      localStorage.setItem(`${PREFIX}_locationRequested`, 'true');
    }
  }, []);

  const handleLocationAllow = async () => {
    setShowLocationModal(false);
    try {
      const location = await requestLocationPermission();
      setUserLocation(location);
      localStorage.setItem(`${PREFIX}_userLocation`, JSON.stringify(location));
    } catch (error) {
      console.error('Location error:', error);
      setUserLocation({});
    }
  };

  const handleLocationDeny = () => {
    setShowLocationModal(false);
    setUserLocation({});
  };

  const openChat = (domain = 'general') => {
    setChatDomain(domain);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const value = {
    userLocation,
    showLocationModal,
    handleLocationAllow,
    handleLocationDeny,
    isChatOpen,
    chatDomain,
    openChat,
    closeChat,
    repositories: repositoriesQuery.data?.data || [],
    repositoriesLoading: repositoriesQuery.isLoading,
    repositoriesError: repositoriesQuery.error,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
