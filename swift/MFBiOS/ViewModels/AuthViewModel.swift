import Foundation
import Combine

@MainActor
final class AuthViewModel: ObservableObject {
    enum State: Equatable {
        case loading
        case authenticated(AuthenticatedUser)
        case authRequired
        case userNotRegistered
        case failed(String)
    }

    @Published private(set) var state: State = .loading
    @Published private(set) var publicSettings: PublicSettingsResponse?

    private let service: AuthBootstrapServicing
    private let appId: String
    private let tokenProvider: () -> String?

    init(
        service: AuthBootstrapServicing,
        appId: String,
        tokenProvider: @escaping () -> String?
    ) {
        self.service = service
        self.appId = appId
        self.tokenProvider = tokenProvider
    }

    func bootstrap() async {
        state = .loading

        do {
            let result = try await service.bootstrap(appId: appId, token: tokenProvider())
            publicSettings = result.publicSettings
            state = .authenticated(result.user)
        } catch let error as AuthBootstrapError {
            switch error {
            case .authRequired:
                state = .authRequired
            case .userNotRegistered:
                state = .userNotRegistered
            case .network(let message):
                state = .failed(message)
            }
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}
