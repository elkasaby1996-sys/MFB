import Foundation
import Combine

@MainActor
final class SettingsViewModel: ObservableObject {
    @Published var selectedCurrencyCode: String = "USD"
    @Published var notificationsEnabled: Bool = true
}
