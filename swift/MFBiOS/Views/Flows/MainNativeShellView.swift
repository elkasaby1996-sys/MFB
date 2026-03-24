import SwiftUI

struct MainNativeShellView: View {
    let user: AuthenticatedUser

    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Home", systemImage: "house.fill") }

            TransactionsView()
                .tabItem { Label("Spending", systemImage: "list.bullet.rectangle.portrait.fill") }

            NativeRouteHubView()
                .tabItem { Label("Explore", systemImage: "square.grid.3x2.fill") }

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .overlay(alignment: .topTrailing) {
            Text(user.name ?? user.email ?? "User")
                .font(.caption2.weight(.semibold))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
                .padding()
        }
    }
}
