import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { 
  Home, 
  Wallet, 
  FileText, 
  MoreHorizontal,
  Plus
} from "lucide-react";
import { nativeHaptics } from '@/lib/native';
import { BottomTabBar, BottomTabBarAction, BottomTabBarItem } from '@/components/layout/BottomTabBar';

const NAV_ITEMS = [
  { name: 'Home', icon: Home, page: 'Dashboard', path: '/Dashboard' },
  { name: 'Spending', icon: Wallet, page: 'SpendingHub', path: '/SpendingHub' },
  { name: 'Reports', icon: FileText, page: 'ReportsHub', path: '/ReportsHub' },
  { name: 'More', icon: MoreHorizontal, page: 'More', path: '/More' },
];

// Scroll behavior thresholds
const SHRINK_DOWN_THRESHOLD = 40;   // px down before compacting
const EXPAND_UP_THRESHOLD   = 12;   // px up before expanding
const NEAR_TOP_THRESHOLD    = 80;   // px from top → always expand
const IDLE_EXPAND_DELAY     = 1200; // ms idle before expanding

// Store scroll positions for each route
const scrollPositions = new Map();

// Detect reduced-motion preference once
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function BottomNav({ currentPage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTab, getTabForPage, resetTabStack } = useNavigation();
  const restoredRef = useRef(false);

  // compact = true means nav is shrunk
  const [compact, setCompact] = useState(false);

  const lastScrollTopRef  = useRef(0);
  const downAccumRef      = useRef(0);   // accumulated downward pixels
  const upAccumRef        = useRef(0);   // accumulated upward pixels
  const idleTimerRef      = useRef(null);
  const rafRef            = useRef(null);
  const compactRef        = useRef(false); // mirror for closure-free access

  const setCompactSafe = useCallback((value) => {
    if (compactRef.current === value) return; // no change → no re-render
    compactRef.current = value;
    setCompact(value);
  }, []);

  // ── Scroll position save/restore ──────────────────────────────────────────
  const saveScrollPosition = useCallback(() => {
    const el = document.querySelector('[class*="overflow-y-auto"]') || window;
    const top = el === window ? window.scrollY : el.scrollTop;
    scrollPositions.set(location.pathname, top);
  }, [location.pathname]);

  useEffect(() => () => saveScrollPosition(), [saveScrollPosition]);

  useEffect(() => {
    if (!restoredRef.current) {
      const saved = scrollPositions.get(location.pathname);
      if (saved !== undefined) {
        const id = setTimeout(() => {
          const el = document.querySelector('[class*="overflow-y-auto"]') || window;
          if (el === window) window.scrollTo({ top: saved, behavior: 'instant' });
          else el.scrollTop = saved;
        }, 0);
        return () => clearTimeout(id);
      }
      restoredRef.current = true;
    }
  }, [location.pathname]);

  useEffect(() => { restoredRef.current = false; }, [location.pathname]);

  // ── Smart scroll handler ───────────────────────────────────────────────────
  useEffect(() => {
    // Reset compact state on page change
    setCompactSafe(false);
    lastScrollTopRef.current = 0;
    downAccumRef.current = 0;
    upAccumRef.current = 0;

    const el = document.querySelector('[class*="overflow-y-auto"]') || window;

    const scheduleIdleExpand = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setCompactSafe(false), IDLE_EXPAND_DELAY);
    };

    const handleScroll = () => {
      if (rafRef.current) return; // already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        const currentTop = el === window ? window.scrollY : el.scrollTop;
        const previous   = lastScrollTopRef.current;
        const delta      = currentTop - previous;
        lastScrollTopRef.current = currentTop;

        // Near top → always expand immediately
        if (currentTop <= NEAR_TOP_THRESHOLD) {
          downAccumRef.current = 0;
          upAccumRef.current = 0;
          setCompactSafe(false);
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          return;
        }

        if (delta > 0) {
          // Scrolling DOWN
          downAccumRef.current += delta;
          upAccumRef.current = 0;
          if (downAccumRef.current >= SHRINK_DOWN_THRESHOLD) {
            setCompactSafe(true);
          }
        } else if (delta < 0) {
          // Scrolling UP
          upAccumRef.current += Math.abs(delta);
          downAccumRef.current = 0;
          if (upAccumRef.current >= EXPAND_UP_THRESHOLD) {
            setCompactSafe(false);
          }
        }

        scheduleIdleExpand();
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [location.pathname, setCompactSafe]);

  // ── Page mapping for active tab ────────────────────────────────────────────
  const pageMapping = {
    'SpendingLog': 'SpendingHub',
    'SpendingCalendar': 'SpendingHub',
    'Reports': 'ReportsHub',
    'HealthScore': 'ReportsHub',
  };
  const activePage = pageMapping[currentPage] || currentPage;

  // ── Tab click ──────────────────────────────────────────────────────────────
  const handleTabClick = useCallback((e, item) => {
    e.preventDefault();
    nativeHaptics.selection();
    // Expand nav immediately on tap
    setCompactSafe(false);
    const currentPageTab = getTabForPage(location.pathname);
    if (currentPageTab === item.path) {
      saveScrollPosition();
      resetTabStack(item.path);
      navigate(createPageUrl(item.page));
      scrollPositions.set(item.path, 0);
    } else {
      saveScrollPosition();
      navigate(createPageUrl(item.page));
    }
  }, [location.pathname, saveScrollPosition, navigate, getTabForPage, setCompactSafe]);

  // ── Derived motion values ──────────────────────────────────────────────────
  // When reduced motion: no shrink at all
  const isCompact = compact && !prefersReducedMotion;

  return (
    <BottomTabBar compact={isCompact}>
      {NAV_ITEMS.slice(0, 2).map((item) => {
        const isActive = currentTab === item.path || activePage === item.page;

        return (
          <BottomTabBarItem
            key={item.name}
            compact={isCompact}
            active={isActive}
            onClick={(e) => handleTabClick(e, item)}
            aria-label={`Navigate to ${item.name}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {({ compact: compactMode, duration, ease }) => (
              <item.icon
                style={{
                  width: compactMode ? '17px' : '20px',
                  height: compactMode ? '17px' : '20px',
                  transition: `width ${duration} ${ease}, height ${duration} ${ease}, color ${duration} ${ease}`,
                  willChange: 'width, height',
                  color: isActive ? 'rgb(34,211,238)' : 'rgba(255,255,255,0.38)',
                }}
                aria-hidden="true"
              />
            )}
          </BottomTabBarItem>
        );
      })}

      <BottomTabBarAction
        onClick={() => {
          nativeHaptics.confirm();
          const event = new CustomEvent('quickAddClick');
          window.dispatchEvent(event);
        }}
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6 text-white" strokeWidth={3} />
      </BottomTabBarAction>

      {NAV_ITEMS.slice(2).map((item) => {
        const isActive = currentTab === item.path || activePage === item.page;

        return (
          <BottomTabBarItem
            key={item.name}
            compact={isCompact}
            active={isActive}
            onClick={(e) => handleTabClick(e, item)}
            aria-label={`Navigate to ${item.name}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {({ compact: compactMode, duration, ease }) => (
              <item.icon
                style={{
                  width: compactMode ? '17px' : '20px',
                  height: compactMode ? '17px' : '20px',
                  transition: `width ${duration} ${ease}, height ${duration} ${ease}, color ${duration} ${ease}`,
                  willChange: 'width, height',
                  color: isActive ? 'rgb(34,211,238)' : 'rgba(255,255,255,0.38)',
                }}
                aria-hidden="true"
              />
            )}
          </BottomTabBarItem>
        );
      })}
    </BottomTabBar>
  );
}