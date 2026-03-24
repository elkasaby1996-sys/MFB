# MFB Native iOS Rewrite (Swift folder)

This folder is a **separate native iOS codebase** that keeps the original web code untouched and ports app logic/flow into Swift for iOS deployment.

## Source analysis that drove this rewrite

The native architecture mirrors the original app behavior identified from:

- `src/App.jsx` (startup lifecycle, auth/public settings bootstrap, route rendering)
- `src/pages.config.js` (all page routes and onboarding default entry)
- `src/Layout.jsx` (global providers, quick-add, add-transaction modal orchestration)
- `src/lib/AuthContext.jsx` (auth/public settings flow states and failure branches)

## Implemented native flow

1. **Bootstrap phase**
   - Native app starts in `AppFlowView`.
   - Runs auth/public settings bootstrap through `AuthViewModel` + `AuthBootstrapService`.
   - Handles states: loading, auth required, user not registered (onboarding), generic startup failure.

2. **Authenticated shell**
   - Routes into tab-based native shell (`MainNativeShellView`).
   - Primary tabs: Home, Spending, Explore, Settings.

3. **Route parity**
   - All web routes in `src/pages.config.js` are represented in `AppRoute`.
   - `NativeRouteHubView` exposes both featured and full route navigation.
   - Core screens are implemented with native views (Dashboard, Transactions, Budgets, CashFlow, Settings, Receipts/Reports/Investments placeholders).

4. **SwiftUI + UIKit coexistence**
   - SwiftUI is primary UI layer.
   - UIKit detail view (`TransactionDetailViewController`) is bridged into SwiftUI via `UIViewControllerRepresentable`.

## Folder layout

```text
swift/
  MFBiOS/
    App/
    Core/
    Models/
    Networking/
    Services/
    ViewModels/
    Views/
      Flows/
      Screens/
      SwiftUI/
      UIKit/
```

## How to continue migrating the rest of the app

- Convert each feature module under `src/components/*` into a dedicated native folder under `Views/` + `ViewModels/` + `Services/`.
- Replace mock services with real networking and persistence implementations.
- Add camera/receipt scanning using VisionKit and CoreML where needed.
- Add StoreKit 2 for paywall/subscription routes.
- Add XCTest + XCUITest coverage per feature route.

## Important guarantee

- Original JavaScript/React code remains unchanged.
- All new native iOS work stays in this `swift/` folder.
