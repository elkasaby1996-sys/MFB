import Foundation
import Combine

@MainActor
final class TransactionsViewModel: ObservableObject {
    @Published private(set) var transactions: [Transaction] = []
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
            transactions = try await repository.fetchTransactions().sorted { $0.date > $1.date }
        } catch {
            errorMessage = "Could not load transactions."
        }

        isLoading = false
    }
}
