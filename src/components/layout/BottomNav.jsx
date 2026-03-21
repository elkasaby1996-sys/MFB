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
    nativeHaptics.tap();
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

  // Easing for all transitions
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const dur  = '380ms';

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed left-0 right-0 z-50 px-safe transition-all duration-200 keyboard-hidden"
      style={{ bottom: 'max(16px, calc(var(--safe-bottom) + 8px))' }}
    >
      <div
        style={{
          margin: isCompact ? '0 20px' : '0 12px',
          borderRadius: '22px',
          background: 'rgba(6, 182, 212, 0.05)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          transition: `margin ${dur} ${ease}`,
          willChange: 'margin',
        }}
      >
        <div
          className="flex items-center justify-around px-1 relative"
          style={{
            paddingTop:    isCompact ? '6px'  : '6px',
            paddingBottom: isCompact ? '6px'  : '6px',
          }}
        >
          {NAV_ITEMS.slice(0, 2).map((item) => {
            const isActive = currentTab === item.path;

            return (
              <button
                key={item.name}
                onClick={(e) => handleTabClick(e, item)}
                className="flex items-center justify-center rounded-2xl cursor-pointer active:scale-90 active:opacity-60"
                style={{
                  minWidth: '40px',
                  minHeight: '40px',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                }}
                aria-label={`Navigate to ${item.name}`}
                aria-current={isActive ? 'page' : undefined}
                type="button"
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width:  isCompact ? '30px' : '34px',
                    height: isCompact ? '30px' : '34px',
                    transition: `width ${dur} ${ease}, height ${dur} ${ease}`,
                    willChange: 'width, height',
                  }}
                >
                  <item.icon
                    style={{
                      width:  isCompact ? '17px' : '20px',
                      height: isCompact ? '17px' : '20px',
                      transition: `width ${dur} ${ease}, height ${dur} ${ease}, color ${dur} ${ease}`,
                      willChange: 'width, height',
                      color: isActive ? 'rgb(34,211,238)' : 'rgba(255,255,255,0.38)',
                    }}
                    aria-hidden="true"
                  />
                </div>
              </button>
            );
          })}

          <button
            onClick={() => {
              nativeHaptics.tap();
              const event = new CustomEvent('quickAddClick');
              window.dispatchEvent(event);
            }}
            aria-label="Add transaction"
            className="flex items-center justify-center rounded-full cursor-pointer active:scale-90 active:opacity-60 transition-transform duration-200"
            style={{
              width: '48px',
              height: '48px',
              background: 'rgba(6, 182, 212, 0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
            }}
            type="button"
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
          </button>

          {NAV_ITEMS.slice(2).map((item) => {
            const isActive = currentTab === item.path;

            return (
              <button
                key={item.name}
                onClick={(e) => handleTabClick(e, item)}
                className="flex items-center justify-center rounded-2xl cursor-pointer active:scale-90 active:opacity-60"
                style={{
                  minWidth: '40px',
                  minHeight: '40px',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                }}
                aria-label={`Navigate to ${item.name}`}
                aria-current={isActive ? 'page' : undefined}
                type="button"
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width:  isCompact ? '30px' : '34px',
                    height: isCompact ? '30px' : '34px',
                    transition: `width ${dur} ${ease}, height ${dur} ${ease}`,
                    willChange: 'width, height',
                  }}
                >
                  <item.icon
                    style={{
                      width:  isCompact ? '17px' : '20px',
                      height: isCompact ? '17px' : '20px',
                      transition: `width ${dur} ${ease}, height ${dur} ${ease}, color ${dur} ${ease}`,
                      willChange: 'width, height',
                      color: isActive ? 'rgb(34,211,238)' : 'rgba(255,255,255,0.38)',
                    }}
                    aria-hidden="true"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
