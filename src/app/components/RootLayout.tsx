import { Outlet, Link, useLocation } from "react-router";
import { Sprout, Menu, X, Home, ShoppingBag, Heart, UserCircle, Settings, LogOut, LayoutDashboard, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path.split("?")[0];

  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const adminDashboardLabel = user?.role === "super_admin" ? "Super Admin" : "Admin Dashboard";

  const handleLogoClick = () => {
    return user ? "/marketplace" : "/";
  };

  const handleSignOut = async () => {
    await signOut();
    setProfileDropdownOpen(false);
    window.location.href = "/";
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={handleLogoClick()} className="flex items-center gap-2" aria-label="SeedLink home">
              <img src="/logo.png" alt="SeedLink logo" className="h-10 w-auto" />
              <span className="font-bold text-xl text-gray-900">SeedLink</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {!user ? (
                // Unauthenticated menu
                <>
                  <Link
                    to="/marketplace"
                    className={`transition-colors ${
                      isActive("/marketplace")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/register-producer"
                    className={`transition-colors ${
                      isActive("/register-producer")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    Join as Seed Producer
                  </Link>
                  <Link
                    to="/login"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Log In
                  </Link>
                </>
              ) : user.role === 'producer' ? (
                // Producer menu
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-1 transition-colors ${
                      isActive("/") && location.pathname === "/"
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                  <Link
                    to="/marketplace"
                    className={`transition-colors ${
                      isActive("/marketplace")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/producer/dashboard"
                    className={`transition-colors ${
                      isActive("/producer/dashboard")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    Producer Dashboard
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                    >
                      <UserCircle className="w-6 h-6" />
                      <span className="text-sm">{user.name}</span>
                    </button>
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <UserCircle className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          to="/my-orders"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          My Orders & Quotes
                        </Link>
                        <Link
                          to="/profile?tab=settings"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : user.role === 'admin' || user.role === 'super_admin' ? (
                // Admin and Super Admin menu
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-1 transition-colors ${
                      isActive("/") && location.pathname === "/"
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                  <Link
                    to="/marketplace"
                    className={`transition-colors ${
                      isActive("/marketplace")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1 transition-colors ${
                      isActive("/admin")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {adminDashboardLabel}
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                    >
                      <UserCircle className="w-6 h-6" />
                      <span className="text-sm">{user.name}</span>
                    </button>
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <UserCircle className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          to="/my-orders"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          My Orders & Quotes
                        </Link>
                        <Link
                          to="/profile?tab=settings"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Buyer menu
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-1 transition-colors ${
                      isActive("/") && location.pathname === "/"
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                  <Link
                    to="/marketplace"
                    className={`transition-colors ${
                      isActive("/marketplace")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/my-orders"
                    className={`flex items-center gap-1 transition-colors ${
                      isActive("/my-orders")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    My Orders
                  </Link>
                  <Link
                    to="/favorite-sellers"
                    className={`flex items-center gap-1 transition-colors ${
                      isActive("/favorite-sellers")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    Favorite Sellers
                  </Link>
                  <Link
                    to="/register-producer"
                    className={`transition-colors ${
                      isActive("/register-producer")
                        ? "text-green-600"
                        : "text-gray-700 hover:text-green-600"
                    }`}
                  >
                    Join as Seed Producer
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                    >
                      <UserCircle className="w-6 h-6" />
                      <span className="text-sm">{user.name}</span>
                    </button>
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <UserCircle className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          to="/profile?tab=settings"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                {!user ? (
                  <>
                    <Link
                      to="/marketplace"
                      className="text-gray-700 hover:text-green-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Marketplace
                    </Link>
                    <Link
                      to="/register-producer"
                      className="text-gray-700 hover:text-green-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Join as Seed Producer
                    </Link>
                    <Link
                      to="/login"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                  </>
                ) : user.role === 'producer' ? (
                  <>
                    <Link to="/" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Home
                    </Link>
                    <Link to="/marketplace" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Marketplace
                    </Link>
                    <Link to="/producer/dashboard?tab=add" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Sell Your Seed
                    </Link>
                    <Link to="/producer/dashboard" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Producer Dashboard
                    </Link>
                    <Link to="/my-orders" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      My Orders & Quotes
                    </Link>
                    <Link to="/profile" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Profile
                    </Link>
                    <button onClick={handleSignOut} className="text-red-600 hover:text-red-700 text-left">
                      Sign Out
                    </button>
                  </>
                ) : user.role === 'admin' || user.role === 'super_admin' ? (
                  <>
                    <Link to="/" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Home
                    </Link>
                    <Link to="/marketplace" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Marketplace
                    </Link>
                    <Link to="/admin" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      {adminDashboardLabel}
                    </Link>
                    <Link to="/my-orders" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      My Orders & Quotes
                    </Link>
                    <Link to="/profile" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Profile
                    </Link>
                    <button onClick={handleSignOut} className="text-red-600 hover:text-red-700 text-left">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Home
                    </Link>
                    <Link to="/marketplace" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Marketplace
                    </Link>
                    <Link to="/my-orders" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      My Orders
                    </Link>
                    <Link to="/favorite-sellers" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Favorite Sellers
                    </Link>
                    <Link to="/register-producer" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Join as Seed Producer
                    </Link>
                    <Link to="/profile" className="text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}>
                      Profile
                    </Link>
                    <button onClick={handleSignOut} className="text-red-600 hover:text-red-700 text-left">
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">SeedLink</span>
              </div>
              <p className="text-sm">
                Connecting certified potato seed producers with farmers across Rwanda.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">For Farmers</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/marketplace" className="hover:text-white">Browse Seeds</Link></li>
                <li><a href="#" className="hover:text-white">How to Order</a></li>
                <li><a href="#" className="hover:text-white">Quality Guarantee</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">For Producers</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register-producer" className="hover:text-white">Register</Link></li>
                <li><a href="#" className="hover:text-white">Certification Info</a></li>
                <li><a href="#" className="hover:text-white">Seller Guide</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">FAQs</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; 2026 SeedLink Rwanda. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
