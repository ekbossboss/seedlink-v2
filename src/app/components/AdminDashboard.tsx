import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router";
import { serverUrl } from "../lib/supabase";
import { SuperAdminUserManagement } from "./SuperAdminUserManagement";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  ShieldCheck,
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  TrendingUp,
  Package,
  ShoppingBag,
  FileText,
  UserCog,
} from "lucide-react";

interface AccessRequest {
  id: string;
  user_id: string;
  user_email: string;
  businessName: string;
  ownerName: string;
  phone: string;
  district: string;
  certificationNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'producer' | 'admin' | 'super_admin';
  created_at: string;
  business_name?: string;
}

interface Stats {
  total_users: number;
  total_buyers: number;
  total_producers: number;
  total_admins: number;
  total_seeds: number;
  total_orders: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
}

export function AdminDashboard() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'users' | 'admins' | 'user-management' | 'settings'>('overview');
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [accessRequestsError, setAccessRequestsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/');
      return;
    }
    if (!accessToken) return;
    fetchData();
  }, [user, accessToken]);

  const fetchData = async () => {
    setAccessRequestsError(null);

    try {
      const [requestsRes, usersRes, statsRes] = await Promise.all([
        fetch(`${serverUrl}/access-requests`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${serverUrl}/admin/users`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${serverUrl}/admin/stats`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
      ]);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setAccessRequests(data.requests);
      } else {
        const error = await requestsRes.json().catch(() => null);
        setAccessRequests([]);
        setAccessRequestsError(
          error?.error || `Failed to load access requests (${requestsRes.status})`
        );
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data.users);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${serverUrl}/access-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        await fetchData();
        setSelectedRequest(null);
        alert('Access request approved successfully!');
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`${serverUrl}/access-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'rejected', reason }),
      });

      if (response.ok) {
        await fetchData();
        setSelectedRequest(null);
        alert('Access request rejected.');
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const pendingCount = accessRequests.filter(r => r.status === 'pending').length;
  const isSuperAdmin = user?.role === 'super_admin';

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">Manage SeedLink platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {[
                { key: 'overview', label: 'Overview', icon: LayoutDashboard },
                { key: 'requests', label: 'Access Requests', icon: UserCheck, badge: pendingCount },
                { key: 'users', label: 'All Users', icon: Users },
                { key: 'admins', label: 'Admins', icon: ShieldCheck },
                ...(isSuperAdmin ? [{ key: 'user-management', label: 'User Management', icon: UserCog }] : []),
                { key: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Total Users</h3>
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Producers</h3>
                      <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_producers}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Buyers</h3>
                      <ShoppingBag className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_buyers}</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Pending Requests</h3>
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.pending_requests}</p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Total Seeds</h3>
                      <Package className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_seeds}</p>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Total Orders</h3>
                      <TrendingUp className="w-5 h-5 text-pink-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_orders}</p>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Approved Requests</h3>
                      <CheckCircle className="w-5 h-5 text-teal-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.approved_requests}</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Rejected Requests</h3>
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.rejected_requests}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Platform Overview</h3>
                  <p className="text-blue-800">
                    SeedLink currently has {stats.total_users} registered users with {stats.total_producers} verified producers offering {stats.total_seeds} seed listings.
                    There are {stats.pending_requests} access requests awaiting review.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Requests</h2>
                {accessRequestsError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {accessRequestsError}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {accessRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{request.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{request.businessName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{request.ownerName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{request.district}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                request.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : request.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(request.submitted_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="text-green-600 hover:text-green-700 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">All Users</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {user.business_name || user.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${
                                user.role === 'admin'
                                  ? 'bg-red-100 text-red-800'
                                  : user.role === 'producer'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'admins' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Administrators</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').map((admin) => (
                        <tr key={admin.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{admin.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(admin.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'user-management' && isSuperAdmin && (
              <SuperAdminUserManagement
                users={allUsers}
                accessToken={accessToken}
                onRefresh={fetchData}
              />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">{isSuperAdmin ? 'Super Admin' : 'Admin'} Settings</h2>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Platform Settings</h3>
                  <p className="text-gray-600">
                    Configure platform-wide settings and preferences.
                  </p>
                </div>

                <div className={`border rounded-lg p-6 ${isSuperAdmin ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
                  <h3 className={`font-semibold mb-2 ${isSuperAdmin ? 'text-purple-900' : 'text-blue-900'}`}>
                    {isSuperAdmin ? 'Super Admin' : 'Admin'} Information
                  </h3>
                  <p className={isSuperAdmin ? 'text-purple-800' : 'text-blue-800'}>
                    You are logged in as {user.name} ({user.email}) with {isSuperAdmin ? 'Super Admin' : 'Admin'} privileges.
                  </p>
                  {isSuperAdmin && (
                    <p className="text-purple-800 mt-2 text-sm">
                      As a Super Admin, you have full control over all users and can create, delete, and manage any account.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Review Access Request</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Request ID:</span>
                    <p className="font-medium text-gray-900">{selectedRequest.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Business Name:</span>
                    <p className="font-medium text-gray-900">{selectedRequest.businessName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner Name:</span>
                    <p className="font-medium text-gray-900">{selectedRequest.ownerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">{selectedRequest.user_email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium text-gray-900">{selectedRequest.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">District:</span>
                    <p className="font-medium text-gray-900">{selectedRequest.district}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Address:</span>
                    <p className="font-medium text-gray-900">{(selectedRequest as any).address || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Certification Number:</span>
                    <p className="font-medium text-gray-900">{selectedRequest.certificationNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Certification Body:</span>
                    <p className="font-medium text-gray-900">{(selectedRequest as any).certificationBody || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedRequest.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium text-gray-900 capitalize">{selectedRequest.status}</p>
                  </div>
                </div>
              </div>

              {(selectedRequest as any).documents && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                  <div className="space-y-3">
                    {Object.entries((selectedRequest as any).documents).map(([key, url]: [string, any]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        </div>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View Document
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Request
                  </button>
                </div>
              )}

              {selectedRequest.status !== 'pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This request was {selectedRequest.status} on{' '}
                    {selectedRequest.reviewed_at
                      ? new Date(selectedRequest.reviewed_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
