import Foundation

protocol Base44ClientProtocol {
    func fetchPublicSettings(appId: String, token: String?) async throws -> PublicSettingsResponse
    func currentUser(token: String) async throws -> AuthenticatedUser
}

final class MockBase44Client: Base44ClientProtocol {
    var shouldRequireAuth = false
    var shouldBeUnregistered = false

    func fetchPublicSettings(appId: String, token: String?) async throws -> PublicSettingsResponse {
        try await Task.sleep(nanoseconds: 150_000_000)

        if shouldRequireAuth || token == nil {
            throw AuthBootstrapError.authRequired
        }

        if shouldBeUnregistered {
            throw AuthBootstrapError.userNotRegistered
        }

        return PublicSettingsResponse(id: appId, publicSettings: ["region": "us", "currency": "USD"])
    }

    func currentUser(token: String) async throws -> AuthenticatedUser {
        try await Task.sleep(nanoseconds: 120_000_000)
        guard token.isEmpty == false else {
            throw AuthBootstrapError.authRequired
        }

        return AuthenticatedUser(id: "demo-user", email: "ios-demo@mfb.app", name: "MFB iOS User")
    }
}
