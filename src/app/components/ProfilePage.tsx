import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { User, Mail, Calendar, Shield } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="bg-green-600 w-24 h-24 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Full Name</h3>
                    </div>
                    <p className="text-gray-700">{user.name}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Email</h3>
                    </div>
                    <p className="text-gray-700">{user.email}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Role</h3>
                    </div>
                    <p className="text-gray-700 capitalize">{user.role}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Member Since</h3>
                    </div>
                    <p className="text-gray-700">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {user.business_name && (
                    <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">Business Name</h3>
                      </div>
                      <p className="text-gray-700">{user.business_name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
                  <p className="text-gray-600 mb-4">
                    To update your account information or change your password, please contact support.
                  </p>
                  <a
                    href="mailto:support@seedlink.rw"
                    className="inline-flex bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Contact Support
                  </a>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="font-semibold text-red-900 mb-2">Danger Zone</h3>
                  <p className="text-red-700 text-sm mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
