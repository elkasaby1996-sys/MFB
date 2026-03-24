import SwiftUI
import UIKit

struct UIKitTransactionDetailContainer: UIViewControllerRepresentable {
    let transaction: Transaction

    func makeUIViewController(context: Context) -> UINavigationController {
        let detail = TransactionDetailViewController(transaction: transaction)
        return UINavigationController(rootViewController: detail)
    }

    func updateUIViewController(_ uiViewController: UINavigationController, context: Context) {
        // No-op for static detail screen.
    }
}
