import Foundation

struct Transaction: Identifiable, Codable, Hashable {
    enum Kind: String, Codable, CaseIterable {
        case income
        case expense
        case transfer
    }

    let id: UUID
    let title: String
    let amount: Decimal
    let currencyCode: String
    let date: Date
    let category: String
    let note: String?
    let kind: Kind
}

struct Budget: Identifiable, Codable, Hashable {
    let id: UUID
    let name: String
    let limit: Decimal
    let spent: Decimal
    let period: String
}

struct Goal: Identifiable, Codable, Hashable {
    let id: UUID
    let title: String
    let targetAmount: Decimal
    let savedAmount: Decimal
}
