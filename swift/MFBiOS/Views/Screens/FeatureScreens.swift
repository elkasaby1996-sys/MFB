import SwiftUI

struct BudgetOverviewView: View {
    @EnvironmentObject private var dashboardViewModel: DashboardViewModel

    var body: some View {
        List(dashboardViewModel.budgets) { budget in
            VStack(alignment: .leading, spacing: 6) {
                Text(budget.name).font(.headline)
                ProgressView(value: progress(for: budget))
                Text("\(budget.spent as NSDecimalNumber, format: .currency(code: "USD")) of \(budget.limit as NSDecimalNumber, format: .currency(code: "USD"))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 4)
        }
        .navigationTitle("Budgets")
        .task { await dashboardViewModel.load() }
    }

    private func progress(for budget: Budget) -> Double {
        guard budget.limit != 0 else { return 0 }
        return NSDecimalNumber(decimal: budget.spent / budget.limit).doubleValue
    }
}

struct CashFlowNativeView: View {
    @EnvironmentObject private var dashboardViewModel: DashboardViewModel

    var body: some View {
        VStack(spacing: 14) {
            StatCard(label: "Expenses", value: dashboardViewModel.monthlyExpenses as NSDecimalNumber, color: .red)
            StatCard(label: "Income", value: 4200, color: .green)
            StatCard(label: "Net", value: NSDecimalNumber(decimal: 4200 - dashboardViewModel.monthlyExpenses), color: .blue)
            Spacer()
        }
        .padding()
        .navigationTitle("Cash Flow")
        .task { await dashboardViewModel.load() }
    }
}

private struct StatCard: View {
    let label: String
    let value: NSDecimalNumber
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(.subheadline).foregroundStyle(.secondary)
            Text(value, format: .currency(code: "USD")).font(.title3.bold()).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

struct InvestmentsNativeView: View {
    var body: some View {
        PlaceholderFeatureView(
            title: "Investments",
            bullets: [
                "Portfolio diversification",
                "Instrument search",
                "Benchmark comparison",
                "AI portfolio insights"
            ]
        )
    }
}

struct ReportsNativeView: View {
    var body: some View {
        PlaceholderFeatureView(
            title: "Reports",
            bullets: ["Monthly report", "Yearly report", "PDF/CSV export", "Trend analytics"]
        )
    }
}

struct NotificationsNativeView: View {
    var body: some View {
        PlaceholderFeatureView(
            title: "Notifications",
            bullets: ["Inbox", "Unread count", "Mark read", "Mark all read"]
        )
    }
}

struct ReceiptsNativeView: View {
    var body: some View {
        PlaceholderFeatureView(
            title: "Receipts",
            bullets: ["Camera scan", "AI extraction", "Review", "Categorization"]
        )
    }
}

struct PlaceholderFeatureView: View {
    let title: String
    let bullets: [String]

    init(route: AppRoute) {
        self.title = route.title
        self.bullets = [
            "Native screen mapped from route: \(route.rawValue)",
            "UI flow defined and ready for detailed component migration",
            "Move JS business logic into corresponding Swift services"
        ]
    }

    init(title: String, bullets: [String]) {
        self.title = title
        self.bullets = bullets
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(title)
                    .font(.largeTitle.bold())
                Text("Native iOS module in-progress")
                    .foregroundStyle(.secondary)
                ForEach(bullets, id: \.self) { bullet in
                    Label(bullet, systemImage: "checkmark.circle")
                }
                Spacer(minLength: 24)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
        }
        .navigationTitle(title)
    }
}
