import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var viewModel: DashboardViewModel

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading dashboard…")
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            SummaryCard(
                                title: "Monthly Expenses",
                                value: currency(viewModel.monthlyExpenses),
                                color: .red
                            )

                            Text("Recent Transactions")
                                .font(.headline)

                            ForEach(viewModel.recentTransactions.prefix(5)) { tx in
                                TransactionRow(transaction: tx)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("MFB")
            .task {
                await viewModel.load()
            }
        }
    }

    private func currency(_ value: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: value as NSDecimalNumber) ?? "$0.00"
    }
}

private struct SummaryCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct TransactionRow: View {
    let transaction: Transaction

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(transaction.title)
                    .font(.body.weight(.medium))
                Text(transaction.category)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(transaction.amount as NSDecimalNumber, format: .currency(code: transaction.currencyCode))
                .foregroundStyle(transaction.kind == .expense ? .red : .green)
        }
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}
