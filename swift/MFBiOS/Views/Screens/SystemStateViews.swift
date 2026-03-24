import SwiftUI

struct LoadingScreen: View {
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text(message)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}

struct AuthRequiredView: View {
    let retryAction: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "lock.shield")
                .font(.largeTitle)
            Text("Login Required")
                .font(.title3.bold())
            Text("Set MFB_TOKEN and retry. In production, this connects to Base44 auth.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Retry", action: retryAction)
                .buttonStyle(.borderedProminent)
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct OnboardingNativeView: View {
    let retryAction: () -> Void

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Welcome to MyFinanceBro")
                    .font(.largeTitle.bold())
                Text("This native onboarding flow maps the web app's onboarding-first behavior.")
                    .foregroundStyle(.secondary)
                Text("Next steps")
                    .font(.headline)
                Label("Create profile", systemImage: "person.crop.circle.badge.plus")
                Label("Set base currency", systemImage: "dollarsign.circle")
                Label("Connect first account", systemImage: "building.columns")
                Button("Retry Auth Check", action: retryAction)
                    .buttonStyle(.borderedProminent)
                    .padding(.top, 8)
            }
            .padding()
            .navigationTitle("Onboarding")
        }
    }
}

struct ErrorRecoveryView: View {
    let message: String
    let retryAction: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.largeTitle)
                .foregroundStyle(.orange)
            Text("Startup Failed")
                .font(.title3.bold())
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Try Again", action: retryAction)
                .buttonStyle(.borderedProminent)
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
