import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var viewModel: SettingsViewModel

    var body: some View {
        NavigationStack {
            Form {
                Section("Preferences") {
                    Picker("Currency", selection: $viewModel.selectedCurrencyCode) {
                        Text("USD").tag("USD")
                        Text("EUR").tag("EUR")
                        Text("GBP").tag("GBP")
                    }

                    Toggle("Enable Notifications", isOn: $viewModel.notificationsEnabled)
                }
            }
            .navigationTitle("Settings")
        }
    }
}
