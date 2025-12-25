// src/services/api.js 
import axios from 'axios';

const API_BASE_URL = 'https://divine-jada-darrylwin-6db2c61b.koyeb.app';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Gestion des erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Service d'authentification
export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/api/auth/register', userData);
    const { access_token, ...userInfo } = response.data;
    
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    
    return response;
  },
  
  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { 
      email, 
      password 
    });
    
    const { access_token, ...userData } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    return response;
  },
  
  getMe: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },
  
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// Service des sessions
export const sessionAPI = {
  create: async (files) => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await apiClient.post('/api/session/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  // Ajouter un fichier à une session existante
  addFile: async (sessionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(
      `/api/session/${sessionId}/add-file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },
  
  getAll: async () => {
    const response = await apiClient.get('/api/session/list');
    return response.data;
  },
  
  get: async (sessionId) => {
    const response = await apiClient.get(`/api/session/${sessionId}`);
    return response.data;
  },
  
  // Récupérer les artefacts d'une session
  getArtifacts: async (sessionId) => {
    try {
      const response = await apiClient.get(`/api/session/${sessionId}/artifacts`);
      return response.data;
    } catch (error) {
      // Retourner un objet vide si non disponible
      return { session_id: sessionId, artifacts: {} };
    }
  },
  
  chat: async (sessionId, message) => {
    try {
      const response = await apiClient.post(`/api/session/${sessionId}/chat`, {
        message: message
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      let responseData = response.data;
      
      if (responseData.data && responseData.data.response) {
        responseData = responseData.data;
      }
      
      if (!responseData.response) {
        const possibleKeys = ['response', 'message', 'answer', 'text', 'content'];
        for (const key of possibleKeys) {
          if (responseData[key]) {
            responseData = { response: responseData[key] };
            break;
          }
        }
        
        if (!responseData.response) {
          responseData = { 
            response: JSON.stringify(responseData) || "Réponse reçue",
            raw: responseData 
          };
        }
      }
      
      return responseData;
      
    } catch (error) {
      let errorMessage = error.message;
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(`Chat API Error: ${errorMessage} (Status: ${error.response?.status})`);
    }
  },
  
  generateTool: async (sessionId, toolType) => {
    const response = await apiClient.post(`/api/session/${sessionId}/generate-tool`, {
      tool_type: toolType
    });
    return response.data;
  },
  
  delete: async (sessionId) => {
    try {
      const response = await apiClient.delete(`/api/session/${sessionId}`);
      return response.data;
    } catch (error) {
      return { success: true };
    }
  }
};

// Service fichiers
export const fileAPI = {
  getFileUrl: (sessionId, filename) => {
    return `${API_BASE_URL}/api/files/${sessionId}/${filename}`;
  },
  
  // Télécharger un fichier
  downloadFile: async (sessionId, filename) => {
    const response = await apiClient.get(
      `/api/files/${sessionId}/${encodeURIComponent(filename)}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
  
  // Visualiser un fichier (pour PDF/images)
  viewFile: (sessionId, filename) => {
    return `${API_BASE_URL}/api/files/${sessionId}/${encodeURIComponent(filename)}`;
  }
};

// Service de santé
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};

export default apiClient;