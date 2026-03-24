import Foundation

struct AuthBootstrapResult {
    let user: AuthenticatedUser
    let publicSettings: PublicSettingsResponse
}

protocol AuthBootstrapServicing {
    func bootstrap(appId: String, token: String?) async throws -> AuthBootstrapResult
}

final class AuthBootstrapService: AuthBootstrapServicing {
    private let client: Base44ClientProtocol

    init(client: Base44ClientProtocol) {
        self.client = client
    }

    func bootstrap(appId: String, token: String?) async throws -> AuthBootstrapResult {
        do {
            let publicSettings = try await client.fetchPublicSettings(appId: appId, token: token)
            guard let token else {
                throw AuthBootstrapError.authRequired
            }
            let user = try await client.currentUser(token: token)
            return AuthBootstrapResult(user: user, publicSettings: publicSettings)
        } catch let error as AuthBootstrapError {
            throw error
        } catch {
            throw AuthBootstrapError.network(error.localizedDescription)
        }
    }
}
