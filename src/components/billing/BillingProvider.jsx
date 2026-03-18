/**
 * Billing Provider - Adapter for Despia IAP
 * 
 * This module provides a clean interface for subscription management
 * that works with Despia's native IAP capabilities.
 * 
 * When Despia provides specific IAP hooks, update the methods below.
 */

export const BillingProvider = {
  /**
   * Subscribe to a product
   * @param {string} productId - Product identifier (e.g., 'com.yourapp.pro.monthly')
   * @returns {Promise<{success: boolean, transactionId?: string, error?: string}>}
   */
  async subscribe(productId) {
    try {
      // iOS via webkit messageHandlers
      if (window.webkit?.messageHandlers?.iap) {
        return new Promise((resolve) => {
          window.webkit.messageHandlers.iap.postMessage({
            action: 'subscribe',
            productId
          });
          
          // Listen for response (Despia should call window.iapCallback)
          window.iapCallback = (response) => {
            resolve(response);
          };
        });
      }
      
      // Android via Android interface
      if (window.Android?.purchaseSubscription) {
        const result = await window.Android.purchaseSubscription(productId);
        return JSON.parse(result);
      }

      // Web fallback - show message
      return {
        success: false,
        error: 'In-app purchases are only available in the mobile app'
      };
    } catch (error) {
      console.error('Subscribe error:', error);
      return {
        success: false,
        error: error.message || 'Failed to initiate purchase'
      };
    }
  },

  /**
   * Restore previous purchases
   * @returns {Promise<{success: boolean, subscriptions?: Array, error?: string}>}
   */
  async restore() {
    try {
      if (window.webkit?.messageHandlers?.iap) {
        return new Promise((resolve) => {
          window.webkit.messageHandlers.iap.postMessage({
            action: 'restore'
          });
          
          window.iapCallback = (response) => {
            resolve(response);
          };
        });
      }
      
      if (window.Android?.restorePurchases) {
        const result = await window.Android.restorePurchases();
        return JSON.parse(result);
      }

      return {
        success: false,
        error: 'Restore is only available in the mobile app'
      };
    } catch (error) {
      console.error('Restore error:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases'
      };
    }
  },

  /**
   * Get current entitlement status
   * @returns {Promise<{isPremium: boolean, expiresAt?: string, productId?: string}>}
   */
  async getEntitlement() {
    try {
      if (window.webkit?.messageHandlers?.iap) {
        return new Promise((resolve) => {
          window.webkit.messageHandlers.iap.postMessage({
            action: 'getEntitlement'
          });
          
          window.iapCallback = (response) => {
            resolve(response);
          };
        });
      }
      
      if (window.Android?.getEntitlement) {
        const result = await window.Android.getEntitlement();
        return JSON.parse(result);
      }

      // Fallback to backend
      return { isPremium: false };
    } catch (error) {
      console.error('Get entitlement error:', error);
      return { isPremium: false };
    }
  },

  /**
   * Open subscription management (App Store/Play Store)
   */
  manageSubscription() {
    try {
      if (window.webkit?.messageHandlers?.iap) {
        window.webkit.messageHandlers.iap.postMessage({
          action: 'manage'
        });
        return;
      }
      
      if (window.Android?.manageSubscription) {
        window.Android.manageSubscription();
        return;
      }

      // Web fallback - open App Store subscription URL
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    } catch (error) {
      console.error('Manage subscription error:', error);
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    }
  }
};