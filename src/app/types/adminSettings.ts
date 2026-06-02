export interface AdminPrefs {
  notify_new_access_request: boolean;
  notify_pending_escalation: boolean;
  notify_flagged_listing: boolean;
  default_landing_tab: "overview" | "requests";
  rejection_templates: string[];
}

export interface SeedCategoryOption {
  value: string;
  label: string;
}

export interface PlatformSettings {
  maintenance_mode: boolean;
  producer_registration_open: boolean;
  quote_expiry_days: number;
  default_listing_unit: string;
  min_listing_price: number;
  min_listing_quantity: number;
  max_open_quotes_per_buyer: number;
  quote_allowed_producers: boolean;
  quote_allowed_admins: boolean;
  quote_allowed_super_admins: boolean;
  review_sla_days: number;
  seed_categories: SeedCategoryOption[];
  supported_varieties: string[];
  supported_districts: string[];
  updated_at: string | null;
  updated_by: string | null;
}

export interface PlatformSettingsResponse {
  platform: PlatformSettings;
  editable: boolean;
  init_super_admin_available: boolean;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: string;
  created_at: string;
}
