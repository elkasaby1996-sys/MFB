/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAssistant from './pages/AIAssistant';
import About from './pages/About';
import Budgets from './pages/Budgets';
import CashFlow from './pages/CashFlow';
import Charity from './pages/Charity';
import CountryDetail from './pages/CountryDetail';
import Dashboard from './pages/Dashboard';
import DebtHub from './pages/DebtHub';
import DeleteAccount from './pages/DeleteAccount';
import ExpatHub from './pages/ExpatHub';
import HealthScore from './pages/HealthScore';
import HomeFinance from './pages/HomeFinance';
import Investments from './pages/Investments';
import MigrateData from './pages/MigrateData';
import More from './pages/More';
import NetWorth from './pages/NetWorth';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Pricing from './pages/Pricing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RealCostMode from './pages/RealCostMode';
import Receipts from './pages/Receipts';
import Reports from './pages/Reports';
import ReportsHub from './pages/ReportsHub';
import Savings from './pages/Savings';
import Settings from './pages/Settings';
import SideHustle from './pages/SideHustle';
import SpendingCalendar from './pages/SpendingCalendar';
import SpendingHub from './pages/SpendingHub';
import SpendingLog from './pages/SpendingLog';
import Subscriptions from './pages/Subscriptions';
import Support from './pages/Support';
import TermsOfService from './pages/TermsOfService';
import UploadScan from './pages/UploadScan';
import Paywall from './pages/Paywall';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "About": About,
    "Budgets": Budgets,
    "CashFlow": CashFlow,
    "Charity": Charity,
    "CountryDetail": CountryDetail,
    "Dashboard": Dashboard,
    "DebtHub": DebtHub,
    "DeleteAccount": DeleteAccount,
    "ExpatHub": ExpatHub,
    "HealthScore": HealthScore,
    "HomeFinance": HomeFinance,
    "Investments": Investments,
    "MigrateData": MigrateData,
    "More": More,
    "NetWorth": NetWorth,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Pricing": Pricing,
    "PrivacyPolicy": PrivacyPolicy,
    "RealCostMode": RealCostMode,
    "Receipts": Receipts,
    "Reports": Reports,
    "ReportsHub": ReportsHub,
    "Savings": Savings,
    "Settings": Settings,
    "SideHustle": SideHustle,
    "SpendingCalendar": SpendingCalendar,
    "SpendingHub": SpendingHub,
    "SpendingLog": SpendingLog,
    "Subscriptions": Subscriptions,
    "Support": Support,
    "TermsOfService": TermsOfService,
    "UploadScan": UploadScan,
    "Paywall": Paywall,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};