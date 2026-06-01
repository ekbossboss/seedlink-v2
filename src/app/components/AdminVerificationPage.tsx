import { useState } from "react";
import { CheckCircle, XCircle, Eye, FileText, Clock } from "lucide-react";

const MOCK_APPLICATIONS = [
  {
    id: "APP-001",
    businessName: "Musanze Seeds Ltd",
    ownerName: "Jean Paul Habimana",
    email: "jp@musanzeseeds.rw",
    phone: "+250 788 123 456",
    district: "Musanze",
    certificationNumber: "RAB-CERT-2026-001",
    status: "pending",
    submittedDate: "2026-05-20",
    documents: {
      certification: true,
      businessLicense: true,
      idDocument: true,
    },
  },
  {
    id: "APP-002",
    businessName: "Rubavu Agricultural Coop",
    ownerName: "Marie Uwimana",
    email: "marie@rubavucoop.rw",
    phone: "+250 788 234 567",
    district: "Rubavu",
    certificationNumber: "RAB-CERT-2026-002",
    status: "pending",
    submittedDate: "2026-05-19",
    documents: {
      certification: true,
      businessLicense: true,
      idDocument: true,
    },
  },
  {
    id: "APP-003",
    businessName: "Kigali Seed Growers",
    ownerName: "Patrick Nkurunziza",
    email: "contact@kigaliseeds.rw",
    phone: "+250 788 345 678",
    district: "Kigali",
    certificationNumber: "RAB-CERT-2026-003",
    status: "approved",
    submittedDate: "2026-05-15",
    reviewedDate: "2026-05-17",
    documents: {
      certification: true,
      businessLicense: true,
      idDocument: true,
    },
  },
];

export function AdminVerificationPage() {
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<typeof MOCK_APPLICATIONS[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const handleApprove = (id: string) => {
    setApplications(apps =>
      apps.map(app =>
        app.id === id
          ? { ...app, status: "approved" as const, reviewedDate: new Date().toISOString().split('T')[0] }
          : app
      )
    );
    setSelectedApp(null);
    alert("Application approved successfully!");
  };

  const handleReject = (id: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      setApplications(apps =>
        apps.map(app =>
          app.id === id
            ? { ...app, status: "rejected" as const, reviewedDate: new Date().toISOString().split('T')[0] }
            : app
        )
      );
      setSelectedApp(null);
      alert("Application rejected.");
    }
  };

  const filteredApps = applications.filter(app =>
    filterStatus === "all" ? true : app.status === filterStatus
  );

  const pendingCount = applications.filter(app => app.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Producer Verification</h1>
          <p className="text-gray-600 mt-1">Review and verify producer applications</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Pending Review</h3>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Approved</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {applications.filter(a => a.status === "approved").length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Rejected</h3>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {applications.filter(a => a.status === "rejected").length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Total Applications</h3>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by status:</label>
              <div className="flex gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === status
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Application ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Business Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{app.businessName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.ownerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.district}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.submittedDate}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          app.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : app.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedApp(app)}
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
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Application Review</h2>
                <button
                  onClick={() => setSelectedApp(null)}
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
                    <span className="text-gray-600">Application ID:</span>
                    <p className="font-medium text-gray-900">{selectedApp.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Business Name:</span>
                    <p className="font-medium text-gray-900">{selectedApp.businessName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner Name:</span>
                    <p className="font-medium text-gray-900">{selectedApp.ownerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">{selectedApp.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium text-gray-900">{selectedApp.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">District:</span>
                    <p className="font-medium text-gray-900">{selectedApp.district}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Certification Number:</span>
                    <p className="font-medium text-gray-900">{selectedApp.certificationNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <p className="font-medium text-gray-900">{selectedApp.submittedDate}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                <div className="space-y-3">
                  {Object.entries(selectedApp.documents).map(([key, uploaded]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      </div>
                      {uploaded && (
                        <button className="text-green-600 hover:text-green-700 text-sm">
                          View Document
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedApp.status === "pending" && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Application
                  </button>
                </div>
              )}

              {selectedApp.status !== "pending" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This application was {selectedApp.status} on {selectedApp.reviewedDate}.
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
