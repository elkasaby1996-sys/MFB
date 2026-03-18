import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NavigationContext = createContext();

// Tab root pages
const TAB_ROOTS = {
  '/Dashboard': 'Dashboard',
  '/SpendingHub': 'SpendingHub',
  '/Budgets': 'Budgets',
  '/ReportsHub': 'ReportsHub',
  '/More': 'More',
};

// Human-readable name for each route, used in the back button label
const ROUTE_LABELS = {
  '/Dashboard': 'Home',
  '/SpendingHub': 'Spending',
  '/SpendingLog': 'Log',
  '/SpendingCalendar': 'Calendar',
  '/Budgets': 'Budgets',
  '/ReportsHub': 'Reports',
  '/Reports': 'Reports',
  '/HealthScore': 'Health',
  '/More': 'More',
  '/Settings': 'Settings',
  '/Savings': 'Savings',
  '/Investments': 'Investments',
  '/NetWorth': 'Net Worth',
  '/DebtHub': 'Debts',
  '/Charity': 'Charity',
  '/ExpatHub': 'Expat',
  '/SideHustle': 'Side Hustle',
  '/Receipts': 'Receipts',
  '/Subscriptions': 'Subscriptions',
  '/Notifications': 'Notifications',
  '/AIAssistant': 'AI Chat',
};

// Child pages mapped to their parent tabs
const PAGE_TO_TAB = {
  '/Dashboard': '/Dashboard',
  '/SpendingHub': '/SpendingHub',
  '/SpendingLog': '/SpendingHub',
  '/SpendingCalendar': '/SpendingHub',
  '/Budgets': '/Budgets',
  '/ReportsHub': '/ReportsHub',
  '/Reports': '/ReportsHub',
  '/HealthScore': '/ReportsHub',
  '/More': '/More',
  '/Settings': '/More',
  '/Savings': '/More',
  '/Investments': '/More',
  '/NetWorth': '/More',
  '/DebtHub': '/More',
  '/Charity': '/More',
  '/ExpatHub': '/More',
  '/SideHustle': '/More',
  '/Receipts': '/More',
  '/Subscriptions': '/More',
  '/Notifications': '/More',
  '/AIAssistant': '/More',
  '/PrivacyPolicy': '/More',
  '/TermsOfService': '/More',
  '/Support': '/More',
  '/About': '/More',
};

export function NavigationProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const DEFAULT_STACKS = {
    '/Dashboard': ['/Dashboard'],
    '/SpendingHub': ['/SpendingHub'],
    '/Budgets': ['/Budgets'],
    '/ReportsHub': ['/ReportsHub'],
    '/More': ['/More'],
  };

  const loadStacks = () => {
    try {
      const saved = sessionStorage.getItem('tabStacks');
      return saved ? JSON.parse(saved) : DEFAULT_STACKS;
    } catch {
      return DEFAULT_STACKS;
    }
  };

  const [tabStacks, setTabStacks] = useState(loadStacks);
  const [currentTab, setCurrentTab] = useState('/Dashboard');

  // Persist tabStacks to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('tabStacks', JSON.stringify(tabStacks));
    } catch {}
  }, [tabStacks]);

  // Determine which tab a page belongs to
  const getTabForPage = useCallback((pathname) => {
    return PAGE_TO_TAB[pathname] || '/More';
  }, []);

  // Update current tab and stack when location changes
  useEffect(() => {
    const tab = getTabForPage(location.pathname);
    setCurrentTab(tab);

    // Update the stack for this tab
    setTabStacks(prev => {
      const currentStack = prev[tab] || [tab];
      const lastInStack = currentStack[currentStack.length - 1];
      
      // If navigating to a new page in this tab, add it to the stack
      if (lastInStack !== location.pathname && !TAB_ROOTS[location.pathname]) {
        return {
          ...prev,
          [tab]: [...currentStack, location.pathname],
        };
      }
      
      return prev;
    });
  }, [location.pathname, getTabForPage]);

  // Navigate to tab root
  const navigateToTab = useCallback((tabPath) => {
    const stack = tabStacks[tabPath] || [tabPath];
    const lastPage = stack[stack.length - 1];
    navigate(lastPage);
  }, [tabStacks, navigate]);

  // Whether there's a previous page in this tab's stack
  const canGoBack = (() => {
    const stack = tabStacks[currentTab] || [currentTab];
    return stack.length > 1;
  })();

  // Label for the previous page in the stack (shown in back button)
  const backLabel = (() => {
    const stack = tabStacks[currentTab] || [currentTab];
    if (stack.length < 2) return 'Back';
    const prevPath = stack[stack.length - 2];
    return ROUTE_LABELS[prevPath] || 'Back';
  })();

  // Handle back navigation within tab
  const goBack = useCallback(() => {
    const stack = tabStacks[currentTab] || [currentTab];
    
    if (stack.length > 1) {
      // Pop current page from stack
      const newStack = stack.slice(0, -1);
      setTabStacks(prev => ({
        ...prev,
        [currentTab]: newStack,
      }));
      navigate(newStack[newStack.length - 1]);
      return true;
    }
    
    // Fallback to browser history
    navigate(-1);
    return false;
  }, [currentTab, tabStacks, navigate]);

  // Reset a tab's stack
  const resetTabStack = useCallback((tabPath) => {
    setTabStacks(prev => ({
      ...prev,
      [tabPath]: [tabPath],
    }));
  }, []);

  const value = {
    currentTab,
    tabStacks,
    navigateToTab,
    goBack,
    canGoBack,
    backLabel,
    resetTabStack,
    getTabForPage,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}