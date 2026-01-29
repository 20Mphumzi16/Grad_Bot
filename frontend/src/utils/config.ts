/**
 * API Configuration
 * Centralized configuration for backend API base URL
 */
export const API_BASE_URL =  
  import.meta.env.VITE_BACKEND_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  'http://127.0.0.1:8000';
 
