import Foundation
import Combine

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published private(set) var recentTransactions: [Transaction] = []
    @Published private(set) var budgets: [Budget] = []
    @Published private(set) var goals: [Goal] = []
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let repository: FinanceRepository

    init(repository: FinanceRepository) {
        self.repository = repository
    }

    func load() async {
        isLoading = true
        errorMessage = nil

        do {
            async let tx = repository.fetchTransactions()
            async let bd = repository.fetchBudgets()
            async let gl = repository.fetchGoals()

            recentTransactions = try await tx.sorted(by: { $0.date > $1.date })
            budgets = try await bd
            goals = try await gl
        } catch {
            errorMessage = "Could not load dashboard data."
        }

        isLoading = false
    }

    var monthlyExpenses: Decimal {
        recentTransactions
            .filter { $0.kind == .expense }
            .reduce(Decimal.zero) { $0 + $1.amount }
    }
}
