import SwiftUI

struct AppFlowView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel

    var body: some View {
        Group {
            switch authViewModel.state {
            case .loading:
                LoadingScreen(message: "Starting MyFinanceBro…")
            case .authRequired:
                AuthRequiredView(retryAction: runBootstrap)
            case .userNotRegistered:
                OnboardingNativeView(retryAction: runBootstrap)
            case .failed(let message):
                ErrorRecoveryView(message: message, retryAction: runBootstrap)
            case .authenticated(let user):
                MainNativeShellView(user: user)
            }
        }
        .task { await authViewModel.bootstrap() }
    }

    private func runBootstrap() {
        Task { await authViewModel.bootstrap() }
    }
}
