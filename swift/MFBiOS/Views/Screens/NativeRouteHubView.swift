import SwiftUI

struct NativeRouteHubView: View {
    private let featured: [AppRoute] = [.dashboard, .budgets, .cashFlow, .investments, .reports, .settings]

    var body: some View {
        NavigationStack {
            List {
                Section("Featured") {
                    ForEach(featured) { route in
                        NavigationLink(value: route) {
                            Label(route.title, systemImage: route.symbol)
                        }
                    }
                }

                Section("All Pages from Original App") {
                    ForEach(AppRoute.allCases) { route in
                        NavigationLink(value: route) {
                            Label(route.title, systemImage: route.symbol)
                        }
                    }
                }
            }
            .navigationTitle("Feature Hub")
            .navigationDestination(for: AppRoute.self) { route in
                NativeRouteScreen(route: route)
            }
        }
    }
}

struct NativeRouteScreen: View {
    let route: AppRoute

    var body: some View {
        switch route {
        case .dashboard:
            DashboardView()
        case .settings:
            SettingsView()
        case .budgets:
            BudgetOverviewView()
        case .cashFlow:
            CashFlowNativeView()
        case .investments:
            InvestmentsNativeView()
        case .reports:
            ReportsNativeView()
        case .notifications:
            NotificationsNativeView()
        case .receipts:
            ReceiptsNativeView()
        default:
            PlaceholderFeatureView(route: route)
        }
    }
}
