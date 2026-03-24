import Foundation

struct AuthenticatedUser: Codable, Equatable {
    let id: String
    let email: String?
    let name: String?
}

struct PublicSettingsResponse: Codable, Equatable {
    let id: String
    let publicSettings: [String: String]
}

enum AuthBootstrapError: Error, Equatable {
    case authRequired
    case userNotRegistered
    case network(String)
}
