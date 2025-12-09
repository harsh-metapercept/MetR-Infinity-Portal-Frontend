const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const documentationAPI = {
  // Get all HTML files for sidebar navigation
  getAllDocs: async () => {
    try {
      const response = await fetch(`${API_BASE}/github-html-files`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all docs:', error);
      throw error;
    }
  },

  // Get specific document for main content
  getDocById: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/github-html-files/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching doc by ID:', error);
      throw error;
    }
  },

  // Get all repositories/modules
  getAllRepositories: async () => {
    try {
      const response = await fetch(`${API_BASE}/github-repositories`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  },

  // Get documents by repository/branch
  getDocsByRepository: async (branchName) => {
    try {
      const response = await fetch(`${API_BASE}/github-html-files?filters[branch][$eq]=${branchName}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching docs by repository:', error);
      throw error;
    }
  }
};