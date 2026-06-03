import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { serverUrl } from "../lib/supabase";
import { publicAnonKey } from '../../../utils/supabase/info';
import { Mail, Lock, User, AlertCircle, CheckCircle, Shield, Loader2 } from "lucide-react";

export function InitSuperAdminPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [setupAvailable, setSetupAvailable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkAvailability = async () => {
      try {
        const response = await fetch(`${serverUrl}/init-super-admin/status`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });

        const rawText = await response.text();
        let data: { available?: boolean; error?: string };
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            response.status === 404
              ? "Server not found (404). Please make sure the Supabase Edge Function is deployed."
              : `Unexpected server response (${response.status}).`
          );
        }

        if (!response.ok) {
          throw new Error(data.error || "Failed to check super admin setup status");
        }

        if (!cancelled) {
          setSetupAvailable(data.available === true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to check super admin setup status.");
        }
      } finally {
        if (!cancelled) {
          setCheckingAvailability(false);
        }
      }
    };

    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${serverUrl}/init-super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      });

      const rawText = await response.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              "Server not found (404). Please make sure the Supabase Edge Function is deployed. Check DEPLOY.md for instructions."
            );
          }
          throw new Error(
            `Server error (${response.status}). The Edge Function may not be deployed yet. Check DEPLOY.md for instructions.`
          );
        }
        throw new Error(`Unexpected server response: ${rawText.slice(0, 100)}`);
      }

      if (!response.ok) {
        if (response.status === 403) {
          setSetupAvailable(false);
        }
        throw new Error(data.error || 'Failed to create super admin account');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create super admin account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-purple-600 p-3 rounded-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 ml-3">SeedLink</h1>
        </div>

        {checkingAvailability ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
            <p className="text-sm">Checking setup availability...</p>
          </div>
        ) : !setupAvailable ? (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Setup Unavailable</h2>
              <p className="text-sm text-gray-700">
                A Super Admin account already exists. This one-time setup page is no longer available.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Link
              to="/login"
              className="block w-full text-center bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-1">Super Admin Initialization</h2>
              <p className="text-sm text-purple-700">
                This page creates the first Super Admin with full system control. Use this ONLY ONCE for initial setup.
              </p>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Super Admin account created successfully!</p>
                  <p className="text-xs text-green-700 mt-1">Redirecting to login...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Super Admin Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Super Admin Full Name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Super Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="superadmin@seedlink.rw"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Super Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Super Admin Powers:</strong> Create/delete any account, change roles, suspend users, manage all admins
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Super Admin Account..." : success ? "Success!" : "Create Super Admin Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                After creating the super admin, you can{" "}
                <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                  sign in here
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
