import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { usePlatformCatalog } from "../contexts/PlatformCatalogContext";
import { serverUrl } from "../lib/supabase";
import { Upload, CheckCircle, FileText, MapPin, Phone, Mail, Building } from "lucide-react";

export function ProducerRegistrationPage() {
  const { user, accessToken } = useAuth();
  const { supportedDistricts } = usePlatformCatalog();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    district: "",
    sector: "",
    address: "",
    certificationNumber: "",
    certificationBody: "",
  });

  const [uploadedDocs, setUploadedDocs] = useState({
    certification: null as string | null,
    businessLicense: null as string | null,
    idDocument: null as string | null,
  });

  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signup');
    } else if (user.role === 'producer') {
      navigate('/producer/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetch(`${serverUrl}/platform/public-status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.producer_registration_open === false) {
          setRegistrationClosed(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (docType: keyof typeof uploadedDocs, file: File) => {
    if (!file || !accessToken) return;

    setUploading(docType);

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('type', docType);

      const response = await fetch(`${serverUrl}/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formDataObj,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadedDocs({ ...uploadedDocs, [docType]: data.url });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!accessToken) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${serverUrl}/access-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          documents: uploadedDocs,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit request');
      }

      alert('Application submitted successfully! You will receive an email notification once verified.');
      navigate('/marketplace');
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Redirecting to signup...</p>
      </div>
    );
  }

  if (registrationClosed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Registration temporarily closed</h1>
          <p className="text-gray-600 mb-6">
            Producer registration is not accepting new applications at this time. Please check back later.
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Register as a Seed Producer
            </h1>
            <p className="text-gray-600">
              Complete the registration to start listing your certified potato seeds
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step >= s
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > s ? "bg-green-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">Business Info</span>
              <span className="text-sm text-gray-600">Documents</span>
              <span className="text-sm text-gray-600">Review</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Your farm or business name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+250 XXX XXX XXX"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select district</option>
                      {supportedDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sector *
                  </label>
                  <input
                    type="text"
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Sector name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Physical Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Complete address"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certification Number *
                  </label>
                  <input
                    type="text"
                    name="certificationNumber"
                    value={formData.certificationNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., RAB-CERT-2026-XXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certification Body *
                  </label>
                  <input
                    type="text"
                    name="certificationBody"
                    value={formData.certificationBody}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Rwanda Agriculture Board"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Next: Upload Documents
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Please upload clear copies of your certification documents. All documents will be verified by our team.
                </p>
              </div>

              {[
                {
                  key: "certification",
                  title: "Seed Certification Document",
                  description: "Official certification from Rwanda Agriculture Board or authorized body",
                },
                {
                  key: "businessLicense",
                  title: "Business License",
                  description: "Valid business registration certificate",
                },
                {
                  key: "idDocument",
                  title: "ID Document",
                  description: "National ID or passport of business owner",
                },
              ].map((doc) => (
                <div
                  key={doc.key}
                  className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                    </div>
                    {uploadedDocs[doc.key as keyof typeof uploadedDocs] && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>

                  {!uploadedDocs[doc.key as keyof typeof uploadedDocs] ? (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(doc.key as keyof typeof uploadedDocs, file);
                          }
                        }}
                        className="hidden"
                        id={`file-${doc.key}`}
                        disabled={uploading !== null}
                      />
                      <label
                        htmlFor={`file-${doc.key}`}
                        className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors w-full justify-center cursor-pointer ${
                          uploading === doc.key ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload className="w-5 h-5" />
                        <span>
                          {uploading === doc.key ? 'Uploading...' : 'Upload Document'}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm">Document uploaded successfully</span>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!Object.values(uploadedDocs).every((v) => v)}
                  className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next: Review & Submit
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Business Name:</span>
                    <p className="font-medium">{formData.businessName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner Name:</span>
                    <p className="font-medium">{formData.ownerName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{formData.email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{formData.phone || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">District:</span>
                    <p className="font-medium">{formData.district || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Sector:</span>
                    <p className="font-medium">{formData.sector || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Certification:</span>
                    <p className="font-medium">{formData.certificationNumber || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(uploadedDocs).map(([key, uploaded]) => (
                    <div key={key} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Your application will be reviewed within 3-5 business days. You'll receive an email notification once verified.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
