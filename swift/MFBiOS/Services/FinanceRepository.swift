import Foundation

protocol FinanceRepository {
    func fetchTransactions() async throws -> [Transaction]
    func fetchBudgets() async throws -> [Budget]
    func fetchGoals() async throws -> [Goal]
}

final class InMemoryFinanceRepository: FinanceRepository {
    func fetchTransactions() async throws -> [Transaction] {
        [
            Transaction(
                id: UUID(),
                title: "Salary",
                amount: Decimal(4200),
                currencyCode: "USD",
                date: .now.addingTimeInterval(-86_400 * 2),
                category: "Income",
                note: "Monthly salary",
                kind: .income
            ),
            Transaction(
                id: UUID(),
                title: "Groceries",
                amount: Decimal(92.35),
                currencyCode: "USD",
                date: .now.addingTimeInterval(-86_400),
                category: "Food",
                note: "Weekly market run",
                kind: .expense
            ),
            Transaction(
                id: UUID(),
                title: "Streaming Subscription",
                amount: Decimal(15.99),
                currencyCode: "USD",
                date: .now,
                category: "Subscriptions",
                note: nil,
                kind: .expense
            )
        ]
    }

    func fetchBudgets() async throws -> [Budget] {
        [
            Budget(id: UUID(), name: "Food", limit: 600, spent: 322, period: "Monthly"),
            Budget(id: UUID(), name: "Transport", limit: 250, spent: 120, period: "Monthly")
        ]
    }

    func fetchGoals() async throws -> [Goal] {
        [
            Goal(id: UUID(), title: "Emergency Fund", targetAmount: 10_000, savedAmount: 4_200),
            Goal(id: UUID(), title: "Vacation", targetAmount: 3_000, savedAmount: 1_100)
        ]
    }
}
