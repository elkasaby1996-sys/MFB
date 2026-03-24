import SwiftUI

@main
struct MFBApp: App {
    @StateObject private var container = AppContainer()

    var body: some Scene {
        WindowGroup {
            AppFlowView()
                .environmentObject(container.authViewModel)
                .environmentObject(container.dashboardViewModel)
                .environmentObject(container.transactionsViewModel)
                .environmentObject(container.settingsViewModel)
        }
    }
}

final class AppContainer: ObservableObject {
    let authViewModel: AuthViewModel
    let dashboardViewModel: DashboardViewModel
    let transactionsViewModel: TransactionsViewModel
    let settingsViewModel: SettingsViewModel

    init(
        authService: AuthBootstrapServicing = AuthBootstrapService(client: MockBase44Client()),
        repository: FinanceRepository = InMemoryFinanceRepository()
    ) {
        authViewModel = AuthViewModel(
            service: authService,
            appId: "mfb-prod-app-id",
            tokenProvider: { ProcessInfo.processInfo.environment["MFB_TOKEN"] }
        )

        dashboardViewModel = DashboardViewModel(repository: repository)
        transactionsViewModel = TransactionsViewModel(repository: repository)
        settingsViewModel = SettingsViewModel()
    }
}
