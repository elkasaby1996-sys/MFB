import UIKit

final class TransactionDetailViewController: UIViewController {
    private let transaction: Transaction

    init(transaction: Transaction) {
        self.transaction = transaction
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        title = "Transaction"

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false

        [
            row("Title", transaction.title),
            row("Category", transaction.category),
            row("Type", transaction.kind.rawValue.capitalized),
            row("Amount", "\(transaction.amount) \(transaction.currencyCode)"),
            row("Date", DateFormatter.localizedString(from: transaction.date, dateStyle: .medium, timeStyle: .none)),
            row("Note", transaction.note ?? "-")
        ].forEach(stack.addArrangedSubview)

        view.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.layoutMarginsGuide.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: view.layoutMarginsGuide.trailingAnchor),
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 24)
        ])
    }

    private func row(_ label: String, _ value: String) -> UIView {
        let container = UIView()
        let titleLabel = UILabel()
        titleLabel.font = .preferredFont(forTextStyle: .caption1)
        titleLabel.textColor = .secondaryLabel
        titleLabel.text = label.uppercased()

        let valueLabel = UILabel()
        valueLabel.font = .preferredFont(forTextStyle: .body)
        valueLabel.text = value
        valueLabel.numberOfLines = 0

        let stack = UIStackView(arrangedSubviews: [titleLabel, valueLabel])
        stack.axis = .vertical
        stack.spacing = 4
        stack.translatesAutoresizingMaskIntoConstraints = false

        container.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            stack.topAnchor.constraint(equalTo: container.topAnchor),
            stack.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        ])

        return container
    }
}
