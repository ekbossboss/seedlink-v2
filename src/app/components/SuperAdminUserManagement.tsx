import { useState } from "react";
import { serverUrl } from "../lib/supabase";
import { UserPlus, Edit2, Trash2, Ban, CheckCircle, XCircle } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  suspended?: boolean;
  suspension_reason?: string;
}

interface Props {
  users: User[];
  accessToken: string | null;
  onRefresh: () => void;
}

export function SuperAdminUserManagement({ users, accessToken, onRefresh }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'role' | 'suspend' | 'delete' | null>(null);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
  });

  const handleCreateUser = async () => {
    if (!accessToken) {
      alert('Operation requires an authenticated admin session.');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/super-admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert('User created successfully!');
      setShowCreateModal(false);
      setNewUser({ name: "", email: "", password: "", role: "buyer" });
      onRefresh();
    } catch (error: any) {
      alert(`Failed to create user: ${error.message}`);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!accessToken) {
      alert('Operation requires an authenticated admin session.');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/super-admin/change-role/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert('User role updated successfully!');
      setSelectedUser(null);
      setActionType(null);
      onRefresh();
    } catch (error: any) {
      alert(`Failed to change role: ${error.message}`);
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    const reason = suspend ? prompt('Enter suspension reason:') : null;
    if (suspend && !reason) return;
    if (!accessToken) {
      alert('Operation requires an authenticated admin session.');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/super-admin/suspend-user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ suspended: suspend, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert(suspend ? 'User suspended successfully!' : 'User reactivated successfully!');
      setSelectedUser(null);
      setActionType(null);
      onRefresh();
    } catch (error: any) {
      alert(`Failed to ${suspend ? 'suspend' : 'reactivate'} user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }
    if (!accessToken) {
      alert('Operation requires an authenticated admin session.');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/super-admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert('User deleted successfully!');
      setSelectedUser(null);
      setActionType(null);
      onRefresh();
    } catch (error: any) {
      alert(`Failed to delete user: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Create User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${
                      user.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'producer'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.suspended ? (
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                     Suspended
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setActionType('role');
                      }}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Change Role"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSuspendUser(user.id, !user.suspended)}
                      className="text-yellow-600 hover:text-yellow-700 p-1"
                      title={user.suspended ? "Reactivate" : "Suspend"}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New User</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="buyer">Buyer</option>
                  <option value="producer">Producer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateUser}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Create User
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {selectedUser && actionType === 'role' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change User Role</h3>

            <p className="text-gray-600 mb-4">
              Change role for <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </p>

            <div className="space-y-2">
              {['buyer', 'producer', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleChangeRole(selectedUser.id, role)}
                  className={`w-full text-left px-4 py-2 rounded-lg border ${
                    selectedUser.role === role
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{role.replace('_', ' ')}</span>
                  {selectedUser.role === role && (
                    <span className="ml-2 text-xs text-purple-600">(Current)</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedUser(null);
                setActionType(null);
              }}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
