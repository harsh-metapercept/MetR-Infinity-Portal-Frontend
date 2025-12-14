import { useQuery } from '@tanstack/react-query';
import { documentationAPI } from '../utils/documentationAPI';

export const useRepositories = () => {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      console.log('🔥 FETCHING REPOSITORIES FROM API');
      const result = await documentationAPI.getAllRepositories();
      console.log('✅ REPOSITORIES FETCHED:', result);
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useDocsByRepository = (branchName) => {
  return useQuery({
    queryKey: ['docs', branchName],
    queryFn: async () => {
      console.log('🔥 FETCHING DOCS FOR BRANCH:', branchName);
      const result = await documentationAPI.getDocsByRepository(branchName);
      console.log('✅ DOCS FETCHED FOR BRANCH:', branchName);
      return result;
    },
    enabled: !!branchName,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useAllDocs = () => {
  return useQuery({
    queryKey: ['docs', 'all'],
    queryFn: async () => {
      console.log('🔥 FETCHING ALL DOCS FROM API');
      const result = await documentationAPI.getAllDocs();
      console.log('✅ ALL DOCS FETCHED');
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useDocById = (docId) => {
  return useQuery({
    queryKey: ['doc', docId],
    queryFn: async () => {
      console.log('🔥 FETCHING DOC BY ID:', docId);
      const result = await documentationAPI.getDocById(docId);
      console.log('✅ DOC FETCHED:', docId);
      return result;
    },
    enabled: !!docId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
