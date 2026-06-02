import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./components/HomePage";
import { MarketplacePage } from "./components/MarketplacePage";
import { ProducerRegistrationPage } from "./components/ProducerRegistrationPage";
import { ProducerDashboard } from "./components/ProducerDashboard";
import { SeedDetailPage } from "./components/SeedDetailPage";
import { ProducerProfilePage } from "./components/ProducerProfilePage";
import { AdminVerificationPage } from "./components/AdminVerificationPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { MyOrdersPage } from "./components/MyOrdersPage";
import { FavoriteSellersPage } from "./components/FavoriteSellersPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { ProfilePage } from "./components/ProfilePage";
import { InitAdminPage } from "./components/InitAdminPage";
import { InitSuperAdminPage } from "./components/InitSuperAdminPage";
import { TestServerPage } from "./components/TestServerPage";

export const router = createBrowserRouter([
  {
    path: "/test-server",
    Component: TestServerPage,
  },
  {
    path: "/init-super-admin",
    Component: InitSuperAdminPage,
  },
  {
    path: "/init-admin",
    Component: InitAdminPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/forgot-password",
    Component: ForgotPasswordPage,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordPage,
  },
  {
    path: "/signup",
    Component: SignupPage,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "marketplace", Component: MarketplacePage },
      { path: "seed/:id", Component: SeedDetailPage },
      { path: "register-producer", Component: ProducerRegistrationPage },
      { path: "producer/dashboard", Component: ProducerDashboard },
      { path: "producer/:id", Component: ProducerProfilePage },
      { path: "my-orders", Component: MyOrdersPage },
      { path: "favorite-sellers", Component: FavoriteSellersPage },
      { path: "profile", Component: ProfilePage },
      { path: "admin", Component: AdminDashboard },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
