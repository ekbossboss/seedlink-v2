import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePlatformCatalog } from "../contexts/PlatformCatalogContext";
import { serverUrl } from "../lib/supabase";
import { publicAnonKey } from "/utils/supabase/info";
import {
  slugifyCategoryValue,
  DEFAULT_SEED_CATEGORIES,
  DEFAULT_SUPPORTED_DISTRICTS,
  DEFAULT_SUPPORTED_VARIETIES,
} from "../lib/platformCatalogDefaults";
import type {
  AdminPrefs,
  AuditLogEntry,
  PlatformSettings,
  PlatformSettingsResponse,
  SeedCategoryOption,
} from "../types/adminSettings";
import {
  Lock,
  Bell,
  ClipboardList,
  Store,
  Shield,
  HelpCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Activity,
  Plus,
  Trash2,
} from "lucide-react";

interface Stats {
  total_users: number;
  total_seeds: number;
  total_orders: number;
  pending_requests: number;
}

interface Props {
  isSuperAdmin: boolean;
  stats: Stats | null;
  onDefaultTabChange?: (tab: "overview" | "requests") => void;
}

const QUOTE_STATUSES = [
  "quote_requested",
  "quote_sent",
  "confirmed",
  "declined",
];

const REQUIRED_DOCS = [
  "Certification document",
  "Business license",
  "ID document",
];

function SettingsCard({
  title,
  children,
  superAdminOnly = false,
}: {
  title: string;
  children: React.ReactNode;
  superAdminOnly?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-6 ${
        superAdminOnly ? "border-purple-200 bg-purple-50/50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        {superAdminOnly && <Shield className="w-4 h-4 text-purple-600" />}
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {superAdminOnly && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
            Super Admin only
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function AdminSettingsPanel({ isSuperAdmin, stats, onDefaultTabChange }: Props) {
  const { user, accessToken, changePassword, refreshProfile } = useAuth();
  const { refreshCatalog } = usePlatformCatalog();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [prefs, setPrefs] = useState<AdminPrefs | null>(null);
  const [platform, setPlatform] = useState<PlatformSettings | null>(null);
  const [platformEditable, setPlatformEditable] = useState(false);
  const [initAvailable, setInitAvailable] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const [newTemplate, setNewTemplate] = useState("");
  const [catalogCategories, setCatalogCategories] = useState<SeedCategoryOption[]>([]);
  const [catalogVarieties, setCatalogVarieties] = useState<string[]>([]);
  const [catalogDistricts, setCatalogDistricts] = useState<string[]>([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newVariety, setNewVariety] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [catalogReady, setCatalogReady] = useState(false);
  const catalogHydratedRef = useRef(false);

  const buildCatalogPayload = () => {
    let categories = [...catalogCategories];
    let varieties = [...catalogVarieties];
    let districts = [...catalogDistricts];

    const pendingCategory = newCategoryLabel.trim();
    if (pendingCategory) {
      let value = slugifyCategoryValue(pendingCategory);
      const existing = new Set(categories.map((c) => c.value));
      let n = 2;
      while (existing.has(value)) value = `${slugifyCategoryValue(pendingCategory)}_${n++}`;
      if (!categories.some((c) => c.label.toLowerCase() === pendingCategory.toLowerCase())) {
        categories = [...categories, { value, label: pendingCategory }];
      }
    }

    const pendingVariety = newVariety.trim();
    if (
      pendingVariety &&
      !varieties.some((v) => v.toLowerCase() === pendingVariety.toLowerCase())
    ) {
      varieties = [...varieties, pendingVariety];
    }

    const pendingDistrict = newDistrict.trim();
    if (
      pendingDistrict &&
      !districts.some((d) => d.toLowerCase() === pendingDistrict.toLowerCase())
    ) {
      districts = [...districts, pendingDistrict];
    }

    return { categories, varieties, districts };
  };

  useEffect(() => {
    if (!accessToken) return;
    catalogHydratedRef.current = false;
    setCatalogReady(false);
    loadSettings();
  }, [accessToken]);

  useEffect(() => {
    if (user) setDisplayName(user.name);
  }, [user]);

  const loadSettings = async () => {
    if (!accessToken) return;
    setLoading(true);
    setMessage(null);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [prefsRes, platformRes, auditRes, healthRes] = await Promise.all([
        fetch(`${serverUrl}/admin/settings/prefs`, { headers }),
        fetch(`${serverUrl}/admin/settings/platform`, { headers }),
        fetch(`${serverUrl}/admin/audit-log?limit=20`, { headers }),
        fetch(`${serverUrl}/health`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
      ]);

      if (prefsRes.ok) {
        const data = await prefsRes.json();
        setPrefs(data.prefs);
      }
      if (platformRes.ok) {
        const data: PlatformSettingsResponse = await platformRes.json();
        setPlatform(data.platform);
        setPlatformEditable(data.editable);
        setInitAvailable(data.init_super_admin_available);
        if (!catalogHydratedRef.current) {
          setCatalogCategories(
            data.platform.seed_categories?.length
              ? data.platform.seed_categories
              : DEFAULT_SEED_CATEGORIES,
          );
          setCatalogVarieties(
            data.platform.supported_varieties?.length
              ? data.platform.supported_varieties
              : DEFAULT_SUPPORTED_VARIETIES,
          );
          setCatalogDistricts(
            data.platform.supported_districts?.length
              ? data.platform.supported_districts
              : DEFAULT_SUPPORTED_DISTRICTS,
          );
          catalogHydratedRef.current = true;
        }
        setCatalogReady(true);
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealthStatus(data.status === "ok" ? "Online" : "Unknown");
      } else {
        setHealthStatus("Unreachable");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load settings." });
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    if (!accessToken || !displayName.trim()) return;
    setSaving("name");
    setMessage(null);
    try {
      const res = await fetch(`${serverUrl}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update name");
      }
      await refreshProfile();
      setMessage({ type: "success", text: "Display name updated." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update name",
      });
    } finally {
      setSaving(null);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setSaving("password");
    setMessage(null);
    try {
      await changePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Password updated successfully." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update password",
      });
    } finally {
      setSaving(null);
    }
  };

  const savePrefs = async (updates: Partial<AdminPrefs>) => {
    if (!accessToken || !prefs) return;
    setSaving("prefs");
    setMessage(null);
    try {
      const res = await fetch(`${serverUrl}/admin/settings/prefs`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ...prefs, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save preferences");
      }
      const data = await res.json();
      setPrefs(data.prefs);
      if (updates.default_landing_tab) {
        onDefaultTabChange?.(updates.default_landing_tab);
      }
      setMessage({ type: "success", text: "Preferences saved." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save preferences",
      });
    } finally {
      setSaving(null);
    }
  };

  const saveCatalog = async () => {
    if (!accessToken) return;
    if (!catalogReady) {
      setMessage({ type: "error", text: "Catalog is still loading. Please wait and try again." });
      return;
    }
    const { categories, varieties, districts } = buildCatalogPayload();
    if (varieties.length === 0) {
      setMessage({ type: "error", text: "Add at least one seed variety before saving." });
      return;
    }
    setSaving("catalog");
    setMessage(null);
    try {
      const res = await fetch(`${serverUrl}/admin/settings/catalog`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          seed_categories: categories,
          supported_varieties: varieties,
          supported_districts: districts,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save catalog");
      }
      const data = await res.json();
      setPlatform(data.platform);
      setCatalogCategories(data.platform.seed_categories || categories);
      setCatalogVarieties(data.platform.supported_varieties || varieties);
      setCatalogDistricts(data.platform.supported_districts || districts);
      setNewCategoryLabel("");
      setNewVariety("");
      setNewDistrict("");
      await refreshCatalog();
      setMessage({ type: "success", text: "Catalog saved." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save catalog",
      });
    } finally {
      setSaving(null);
    }
  };

  const addCategory = () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    let value = slugifyCategoryValue(label);
    const existing = new Set(catalogCategories.map((c) => c.value));
    let n = 2;
    while (existing.has(value)) {
      value = `${slugifyCategoryValue(label)}_${n++}`;
    }
    setCatalogCategories([...catalogCategories, { value, label }]);
    setNewCategoryLabel("");
  };

  const removeCategory = (value: string) => {
    if (catalogCategories.length <= 1) {
      setMessage({ type: "error", text: "At least one seed category is required." });
      return;
    }
    setCatalogCategories(catalogCategories.filter((c) => c.value !== value));
  };

  const addVariety = () => {
    const name = newVariety.trim();
    if (!name) return;
    if (catalogVarieties.some((v) => v.toLowerCase() === name.toLowerCase())) return;
    setCatalogVarieties([...catalogVarieties, name]);
    setNewVariety("");
  };

  const removeVariety = (name: string) => {
    if (catalogVarieties.length <= 1) {
      setMessage({ type: "error", text: "At least one seed variety is required." });
      return;
    }
    setCatalogVarieties(catalogVarieties.filter((v) => v !== name));
  };

  const addDistrict = () => {
    const name = newDistrict.trim();
    if (!name) return;
    if (catalogDistricts.some((d) => d.toLowerCase() === name.toLowerCase())) return;
    setCatalogDistricts([...catalogDistricts, name]);
    setNewDistrict("");
  };

  const removeDistrict = (name: string) => {
    if (catalogDistricts.length <= 1) {
      setMessage({ type: "error", text: "At least one district is required." });
      return;
    }
    setCatalogDistricts(catalogDistricts.filter((d) => d !== name));
  };

  const savePlatform = async () => {
    if (!accessToken || !platform || !platformEditable) return;
    const { categories, varieties, districts } = buildCatalogPayload();
    setSaving("platform");
    setMessage(null);
    try {
      const res = await fetch(`${serverUrl}/super-admin/platform-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...platform,
          seed_categories: categories,
          supported_varieties: varieties,
          supported_districts: districts,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save platform settings");
      }
      const data = await res.json();
      setPlatform(data.platform);
      setCatalogCategories(data.platform.seed_categories || categories);
      setCatalogVarieties(data.platform.supported_varieties || varieties);
      setCatalogDistricts(data.platform.supported_districts || districts);
      setNewCategoryLabel("");
      setNewVariety("");
      setNewDistrict("");
      await refreshCatalog();
      setMessage({ type: "success", text: "Platform settings saved." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save platform settings",
      });
    } finally {
      setSaving(null);
    }
  };

  const exportData = async (type: "users" | "access-requests" | "quotes") => {
    if (!accessToken) return;
    setSaving(`export-${type}`);
    try {
      const res = await fetch(`${serverUrl}/super-admin/export/${type}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seedlink-${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      await loadSettings();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Export failed",
      });
    } finally {
      setSaving(null);
    }
  };

  const addTemplate = () => {
    if (!prefs || !newTemplate.trim()) return;
    const templates = [...prefs.rejection_templates, newTemplate.trim()];
    setPrefs({ ...prefs, rejection_templates: templates });
    setNewTemplate("");
  };

  const removeTemplate = (index: number) => {
    if (!prefs) return;
    setPrefs({
      ...prefs,
      rejection_templates: prefs.rejection_templates.filter((_, i) => i !== index),
    });
  };

  const formatAction = (action: string) =>
    action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isSuperAdmin ? "Super Admin" : "Admin"} Settings
        </h2>
        <p className="text-gray-600 mt-1">
          Manage your account, workflow preferences, and platform configuration.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-4 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Account & security */}
      <SettingsCard title="Account & security">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={saveName}
                disabled={saving === "name"}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving === "name" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Change password</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                minLength={6}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={savePassword}
              disabled={saving === "password" || !newPassword}
              className="mt-3 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 text-sm"
            >
              {saving === "password" ? "Updating..." : "Update password"}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Signed in as {isSuperAdmin ? "Super Admin" : "Admin"} · Role cannot be changed here.
          </p>
        </div>
      </SettingsCard>

      {/* Notifications */}
      {prefs && (
        <SettingsCard title="Notification preferences">
          <p className="text-sm text-gray-600 mb-4">
            Preferences are saved for your account. Email delivery can be enabled in a future release.
          </p>
          <div className="space-y-3">
            {[
              { key: "notify_new_access_request" as const, label: "New producer access request" },
              { key: "notify_pending_escalation" as const, label: "Pending request escalation reminder" },
              { key: "notify_flagged_listing" as const, label: "Flagged listing alerts" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default dashboard tab on login
            </label>
            <select
              value={prefs.default_landing_tab}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  default_landing_tab: e.target.value as "overview" | "requests",
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="overview">Overview</option>
              <option value="requests">Access Requests</option>
            </select>
          </div>
          <button
            onClick={() => savePrefs(prefs)}
            disabled={saving === "prefs"}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {saving === "prefs" ? "Saving..." : "Save notification preferences"}
          </button>
        </SettingsCard>
      )}

      {/* Verification workflow */}
      {prefs && platform && (
        <SettingsCard title="Producer verification workflow">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              Review target: respond within{" "}
              <strong>{platform.review_sla_days} business days</strong>. Overdue requests are
              highlighted on the Access Requests tab.
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Required documents</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {REQUIRED_DOCS.map((doc) => (
                  <li key={doc} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rejection reason templates</h4>
              <ul className="space-y-2 mb-3">
                {prefs.rejection_templates.map((template, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200 text-sm"
                  >
                    <span>{template}</span>
                    <button
                      onClick={() => removeTemplate(index)}
                      className="text-red-600 hover:text-red-700"
                      aria-label="Remove template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  placeholder="Add new template..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onKeyDown={(e) => e.key === "Enter" && addTemplate()}
                />
                <button
                  onClick={addTemplate}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => savePrefs(prefs)}
              disabled={saving === "prefs"}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              Save workflow preferences
            </button>
          </div>
        </SettingsCard>
      )}

      {/* Platform catalog (admin + super admin) */}
      <SettingsCard title="Platform catalog">
        <p className="text-sm text-gray-600 mb-4">
          Categories, varieties, and districts appear on listing forms, producer registration
          (districts), and marketplace filters.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Seed categories</h4>
            <ul className="space-y-2 mb-3">
              {catalogCategories.map((cat) => (
                <li
                  key={cat.value}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200 text-sm"
                >
                  <span>
                    {cat.label}{" "}
                    <span className="text-gray-400 text-xs">({cat.value})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCategory(cat.value)}
                    className="text-red-600 hover:text-red-700"
                    aria-label={`Remove ${cat.label}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="New category label..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
              />
              <button
                type="button"
                onClick={addCategory}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Seed varieties</h4>
            <ul className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {catalogVarieties.map((variety) => (
                <li
                  key={variety}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200 text-sm"
                >
                  <span>{variety}</span>
                  <button
                    type="button"
                    onClick={() => removeVariety(variety)}
                    className="text-red-600 hover:text-red-700"
                    aria-label={`Remove ${variety}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVariety}
                onChange={(e) => setNewVariety(e.target.value)}
                placeholder="New variety name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyDown={(e) => e.key === "Enter" && addVariety()}
              />
              <button
                type="button"
                onClick={addVariety}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Supported districts</h4>
            <ul className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {catalogDistricts.map((district) => (
                <li
                  key={district}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200 text-sm"
                >
                  <span>{district}</span>
                  <button
                    type="button"
                    onClick={() => removeDistrict(district)}
                    className="text-red-600 hover:text-red-700"
                    aria-label={`Remove ${district}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDistrict}
                onChange={(e) => setNewDistrict(e.target.value)}
                placeholder="New district name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyDown={(e) => e.key === "Enter" && addDistrict()}
              />
              <button
                type="button"
                onClick={addDistrict}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Type a name and press + or Enter to add it to the list, then click Save catalog. Unsaved
          text in the input boxes is included when you save.
        </p>
        <button
          type="button"
          onClick={saveCatalog}
          disabled={saving === "catalog" || !catalogReady}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          {saving === "catalog" ? "Saving..." : catalogReady ? "Save catalog" : "Loading catalog..."}
        </button>
      </SettingsCard>

      {/* Marketplace & quotes summary */}
      {platform && (
        <SettingsCard title="Marketplace & quotes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Quote flow</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Statuses: {QUOTE_STATUSES.join(" → ")}</li>
                <li>
                  Who can request:{" "}
                  {[
                    platform.quote_allowed_producers && "Producers",
                    platform.quote_allowed_admins && "Admins",
                    platform.quote_allowed_super_admins && "Super Admins",
                  ]
                    .filter(Boolean)
                    .join(", ") || "None"}
                </li>
                <li>Quote expiry: {platform.quote_expiry_days} days</li>
                <li>Max open quotes per buyer: {platform.max_open_quotes_per_buyer}</li>
              </ul>
            </div>
            {stats && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Platform snapshot</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>{stats.total_users} users</li>
                  <li>{stats.total_seeds} listings</li>
                  <li>{stats.total_orders} orders</li>
                  <li>{stats.pending_requests} pending access requests</li>
                </ul>
              </div>
            )}
          </div>
          {!platformEditable && (
            <p className="mt-4 text-xs text-gray-500 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Maintenance and quote policy toggles are managed by Super Admin below.
            </p>
          )}
        </SettingsCard>
      )}

      {/* Super Admin platform configuration */}
      {isSuperAdmin && platform && platformEditable && (
        <SettingsCard title="Platform configuration" superAdminOnly>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={platform.maintenance_mode}
                  onChange={(e) =>
                    setPlatform({ ...platform, maintenance_mode: e.target.checked })
                  }
                  className="rounded border-gray-300 text-purple-600"
                />
                <span className="text-sm">Marketplace maintenance mode</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={platform.producer_registration_open}
                  onChange={(e) =>
                    setPlatform({ ...platform, producer_registration_open: e.target.checked })
                  }
                  className="rounded border-gray-300 text-purple-600"
                />
                <span className="text-sm">Producer registration open</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: "quote_expiry_days", label: "Quote expiry (days)", type: "number" },
                { key: "review_sla_days", label: "Review SLA (days)", type: "number" },
                { key: "max_open_quotes_per_buyer", label: "Max open quotes / buyer", type: "number" },
                { key: "min_listing_price", label: "Min listing price", type: "number" },
                { key: "min_listing_quantity", label: "Min listing quantity", type: "number" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    value={platform[key as keyof PlatformSettings] as number}
                    onChange={(e) =>
                      setPlatform({
                        ...platform,
                        [key]: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Default unit</label>
                <input
                  type="text"
                  value={platform.default_listing_unit}
                  onChange={(e) =>
                    setPlatform({ ...platform, default_listing_unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Who can request quotes</h4>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: "quote_allowed_producers" as const, label: "Producers" },
                  { key: "quote_allowed_admins" as const, label: "Admins" },
                  { key: "quote_allowed_super_admins" as const, label: "Super Admins" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={platform[key]}
                      onChange={(e) =>
                        setPlatform({ ...platform, [key]: e.target.checked })
                      }
                      className="rounded border-gray-300 text-purple-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Init super admin setup:{" "}
              {initAvailable ? "Available (no super admin exists)" : "Unavailable (super admin exists)"}
            </p>
            {platform.updated_at && (
              <p className="text-xs text-gray-400">
                Last updated {new Date(platform.updated_at).toLocaleString()}
              </p>
            )}
            <button
              onClick={savePlatform}
              disabled={saving === "platform"}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              {saving === "platform" ? "Saving..." : "Save platform settings"}
            </button>
          </div>
        </SettingsCard>
      )}

      {/* Audit log */}
      <SettingsCard title={isSuperAdmin ? "Audit log (all actions)" : "My recent actions"}>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-gray-500">No audit entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                  <th className="py-2 pr-4">When</th>
                  {isSuperAdmin && <th className="py-2 pr-4">Actor</th>}
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Target</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-2 pr-4 text-gray-900">{log.actor_name}</td>
                    )}
                    <td className="py-2 pr-4">{formatAction(log.action)}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {log.target_type && log.target_id
                        ? `${log.target_type}: ${log.target_id.slice(0, 12)}…`
                        : "—"}
                    </td>
                    <td className="py-2 text-gray-600 max-w-xs truncate">{log.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>

      {/* Super Admin exports */}
      {isSuperAdmin && (
        <SettingsCard title="Data export" superAdminOnly>
          <p className="text-sm text-gray-600 mb-4">Download CSV reports for platform data.</p>
          <div className="flex flex-wrap gap-3">
            {(["users", "access-requests", "quotes"] as const).map((type) => (
              <button
                key={type}
                onClick={() => exportData(type)}
                disabled={saving === `export-${type}`}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 text-sm"
              >
                <Download className="w-4 h-4" />
                {saving === `export-${type}` ? "Exporting..." : `Export ${type}`}
              </button>
            ))}
          </div>
        </SettingsCard>
      )}

      {/* Help & support */}
      <SettingsCard title="Help & support">
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            For platform issues contact{" "}
            <a href="mailto:support@seedlink.rw" className="text-green-600 hover:underline">
              support@seedlink.rw
            </a>
          </p>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <span>
              API health:{" "}
              <span
                className={
                  healthStatus === "Online" ? "text-green-600 font-medium" : "text-red-600"
                }
              >
                {healthStatus || "Checking..."}
              </span>
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Admins review producer access requests and monitor marketplace activity. Super Admins
            additionally manage platform-wide rules and user accounts.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
}
