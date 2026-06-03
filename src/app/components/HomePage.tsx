import { Link } from "react-router";
import { ShieldCheck, Users, Truck, Search, ChevronRight, Eye, Target } from "lucide-react";

/** Unsplash — potato crop & harvest imagery aligned with SeedLink’s marketplace story */
const HOME_IMAGES = {
  /** Farmers discover certified seed: healthy potato plants in the field */
  hero: {
    src: "https://images.unsplash.com/photo-1741003188234-1d031351168c?w=1200&h=800&fit=crop&q=80",
    alt: "Rows of potato plants growing in a green field",
  },
  /** Producers list quality seed: fresh potatoes ready for market */
  producers: {
    src: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&h=900&fit=crop&q=80",
    alt: "Freshly harvested potatoes sorted for sale",
  },
} as const;

export function HomePage() {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-br from-green-50 to-green-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Quality Potato Seeds,
                <br />
                <span className="text-green-600">Directly from Certified Producers</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                SeedLink connects farmers with verified seed producers across Rwanda. Find certified, high-quality potato seeds for better yields.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/marketplace"
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  Browse Marketplace
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/register-producer"
                  className="bg-white text-green-600 px-8 py-3 rounded-lg border-2 border-green-600 hover:bg-green-50 transition-colors flex items-center justify-center"
                >
                  Sell Your Seed
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <img
                src={HOME_IMAGES.hero.src}
                alt={HOME_IMAGES.hero.alt}
                className="w-full h-80 object-cover rounded-lg"
                loading="eager"
                decoding="async"
              />
              <p className="mt-3 text-sm text-gray-500 text-center">
                Quality seed starts in the field — browse verified listings on SeedLink.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose SeedLink?</h2>
            <p className="text-xl text-gray-600">
              Trusted by farmers and producers across Rwanda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Certified Producers</h3>
              <p className="text-gray-600">
                All seed producers are verified and certified, ensuring quality and authenticity.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Easy Discovery</h3>
              <p className="text-gray-600">
                Browse and compare different seed varieties from multiple producers in one place.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Direct Connection</h3>
              <p className="text-gray-600">
                Connect directly with producers, eliminating middlemen and reducing costs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Reliable Delivery</h3>
              <p className="text-gray-600">
                Track your orders and coordinate delivery directly with trusted producers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src={HOME_IMAGES.producers.src}
                alt={HOME_IMAGES.producers.alt}
                className="w-full h-96 object-cover rounded-2xl shadow-xl"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                For Certified Producers
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Reach more customers and grow your business. List your certified potato seeds on SeedLink and connect with farmers across Rwanda.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="bg-green-600 rounded-full p-1 mt-1">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">Simple registration with document verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-green-600 rounded-full p-1 mt-1">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">Manage your inventory and listings easily</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-green-600 rounded-full p-1 mt-1">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">Connect directly with verified customers</span>
                </li>
              </ul>
              <Link
                to="/register-producer"
                className="inline-flex bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Selling Today
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join Rwanda's premier potato seed marketplace today
          </p>
          <Link
            to="/marketplace"
            className="inline-flex bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg"
          >
            Explore the Marketplace
          </Link>
        </div>
      </section>

      <section className="bg-gradient-to-br from-green-600 to-green-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Our Mission & Vision
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 w-11 h-11 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Vision</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                To become the leading digital marketplace for quality potato seeds in Rwanda.
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 w-11 h-11 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Mission</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Connecting trusted seed producers and farmers through a simple, reliable, and
                efficient digital marketplace.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
