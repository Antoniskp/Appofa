'use client';

import { useAuth } from '@/lib/auth-context';

/**
 * Custom hook for permission checking
 * Centralizes all permission logic in one place for consistency
 * 
 * @returns {Object} Permission checking functions and role flags
 */
export function usePermissions() {
  const { user } = useAuth();
  
  // Role checks
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const isEditor = user?.role === 'editor';
  const isViewer = user?.role === 'viewer';
  const isAuthenticated = !!user;
  
  // Article permissions
  const canEditArticle = (article) => {
    if (!user || !article) return false;
    
    // Admin and editor can edit any article
    if (user.role === 'admin' || user.role === 'editor') {
      return true;
    }
    
    // Author can edit their own article
    return user.id === article.authorId;
  };
  
  const canDeleteArticle = (article) => {
    if (!user || !article) return false;
    
    // Admin can delete any article
    if (user.role === 'admin') {
      return true;
    }
    
    // Author can delete their own article
    return user.id === article.authorId;
  };
  
  const canPublishArticle = (article) => {
    if (!user || !article) return false;
    
    // Admin and editor can publish any article
    if (user.role === 'admin' || user.role === 'editor') {
      return true;
    }
    
    // Author can publish their own article
    return user.id === article.authorId;
  };
  
  // News approval permissions
  const canApproveNews = () => {
    return user && (user.role === 'admin' || user.role === 'moderator');
  };
  
  // Location permissions
  const canManageLocations = () => {
    return user && (user.role === 'admin' || user.role === 'moderator');
  };
  
  const canLinkLocation = (article) => {
    // Anyone who can edit the article can link locations
    return canEditArticle(article);
  };
  
  // User management permissions
  const canManageUsers = () => {
    return user?.role === 'admin';
  };
  
  const canEditUser = (targetUser) => {
    if (!user || !targetUser) return false;
    
    // Admin can edit any user
    if (user.role === 'admin') {
      return true;
    }
    
    // Users can edit their own profile
    return user.id === targetUser.id;
  };
  
  // General admin access
  const canAccessAdmin = () => {
    return user && (user.role === 'admin' || user.role === 'moderator');
  };
  
  return {
    // Role flags
    isAdmin,
    isModerator,
    isEditor,
    isViewer,
    isAuthenticated,
    
    // Article permissions
    canEditArticle,
    canDeleteArticle,
    canPublishArticle,
    
    // News permissions
    canApproveNews,
    
    // Location permissions
    canManageLocations,
    canLinkLocation,
    
    // User permissions
    canManageUsers,
    canEditUser,
    
    // Admin access
    canAccessAdmin,
  };
}
