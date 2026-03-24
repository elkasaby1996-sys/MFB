import SwiftUI

struct TransactionsView: View {
    @EnvironmentObject private var viewModel: TransactionsViewModel

    var body: some View {
        NavigationStack {
            List(viewModel.transactions) { transaction in
                NavigationLink {
                    UIKitTransactionDetailContainer(transaction: transaction)
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(transaction.title)
                            .font(.body.weight(.medium))
                        Text(transaction.date, style: .date)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView("Loading transactions…")
                }
            }
            .navigationTitle("Transactions")
            .task {
                await viewModel.load()
            }
        }
    }
}
