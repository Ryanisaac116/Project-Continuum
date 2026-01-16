/**
 * API Index - Central export for all API modules
 * 
 * Usage:
 *   import { friendsApi, getToken } from '../api';
 *   import apiClient from '../api';
 */

// Core client and utilities
export { default as apiClient, getToken, getUserId, clearAuthState, getWsUrl } from './client';

// Domain APIs
export { authApi } from './authApi';
export { default as chatApi } from './chat';
export { friendsApi } from './friends';
export { exchangeApi } from './exchange';
export { profileApi } from './profile';
export { default as presenceApi } from './presence';

// Default export is the API client
export { default } from './client';
