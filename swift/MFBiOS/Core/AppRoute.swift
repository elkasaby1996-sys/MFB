import Foundation

/// Mirrors `src/pages.config.js` routes so the native app preserves the original flow.
enum AppRoute: String, CaseIterable, Identifiable {
    case aiAssistant = "AIAssistant"
    case about = "About"
    case budgets = "Budgets"
    case cashFlow = "CashFlow"
    case charity = "Charity"
    case countryDetail = "CountryDetail"
    case dashboard = "Dashboard"
    case debtHub = "DebtHub"
    case deleteAccount = "DeleteAccount"
    case expatHub = "ExpatHub"
    case healthScore = "HealthScore"
    case homeFinance = "HomeFinance"
    case investments = "Investments"
    case migrateData = "MigrateData"
    case more = "More"
    case netWorth = "NetWorth"
    case notifications = "Notifications"
    case onboarding = "Onboarding"
    case pricing = "Pricing"
    case privacyPolicy = "PrivacyPolicy"
    case realCostMode = "RealCostMode"
    case receipts = "Receipts"
    case reports = "Reports"
    case reportsHub = "ReportsHub"
    case savings = "Savings"
    case settings = "Settings"
    case sideHustle = "SideHustle"
    case spendingCalendar = "SpendingCalendar"
    case spendingHub = "SpendingHub"
    case spendingLog = "SpendingLog"
    case subscriptions = "Subscriptions"
    case support = "Support"
    case termsOfService = "TermsOfService"
    case uploadScan = "UploadScan"
    case paywall = "Paywall"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .aiAssistant: "AI Assistant"
        case .debtHub: "Debt Hub"
        case .expatHub: "Expat Hub"
        case .healthScore: "Health Score"
        case .homeFinance: "Home Finance"
        case .migrateData: "Migrate Data"
        case .netWorth: "Net Worth"
        case .privacyPolicy: "Privacy Policy"
        case .realCostMode: "Real Cost Mode"
        case .reportsHub: "Reports Hub"
        case .sideHustle: "Side Hustle"
        case .spendingCalendar: "Spending Calendar"
        case .spendingHub: "Spending Hub"
        case .spendingLog: "Spending Log"
        case .termsOfService: "Terms of Service"
        case .uploadScan: "Upload Scan"
        default: rawValue
        }
    }

    var symbol: String {
        switch self {
        case .dashboard: "chart.pie.fill"
        case .budgets: "dollarsign.circle.fill"
        case .cashFlow: "waveform.path.ecg"
        case .investments: "chart.line.uptrend.xyaxis"
        case .reports, .reportsHub: "doc.text.fill"
        case .settings: "gearshape.fill"
        case .notifications: "bell.fill"
        case .receipts: "doc.viewfinder"
        case .more: "ellipsis.circle.fill"
        case .aiAssistant: "sparkles"
        default: "square.grid.2x2"
        }
    }
}
