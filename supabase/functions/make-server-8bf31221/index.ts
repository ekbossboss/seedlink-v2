import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import {
  sendProducerRequestApprovedEmail,
  sendProducerRequestReceivedEmail,
  sendProducerRequestRejectedEmail,
} from "./email.ts";

const FUNCTION_NAME = "make-server-8bf31221";
const app = new Hono().basePath(`/${FUNCTION_NAME}`);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to create authenticated Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
};

// Initialize storage bucket on first run
const initStorage = async () => {
  try {
    const supabase = getSupabaseClient();
    const bucketName = 'seedlink-documents';

    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      console.log('Storage bucket created:', bucketName);
    }
  } catch (error) {
    console.log('Storage init error (non-fatal):', error);
  }
};

// Initialize storage on startup
initStorage();

// Helper to verify user from access token
const verifyUser = async (authHeader: string | null) => {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
};

const isAdminOrSuperAdmin = (profile: any) => {
  return profile.role === 'admin' || profile.role === 'super_admin';
};

const parseStored = (value: unknown) => {
  if (value == null) return null;
  if (typeof value === "string") return JSON.parse(value);
  return value;
};

const hasSuperAdmin = async () => {
  const users = await kv.getByPrefix("user:");
  return users.some((userData) => parseStored(userData)?.role === "super_admin");
};

const PLATFORM_SETTINGS_KEY = "platform:settings";

const DEFAULT_SEED_CATEGORIES = [
  { value: "mini_tubers_g1", label: "Mini tubers (G1)" },
  { value: "apical_cuttings_g1", label: "Apical cuttings (G1)" },
  { value: "pre_basic_g2", label: "Pre basic seed (G2)" },
  { value: "basic_g3", label: "Basic seed (G3)" },
  { value: "certified_g4", label: "Certified seed (G4)" },
  { value: "other", label: "Other" },
];

const DEFAULT_SUPPORTED_DISTRICTS = [
  "Kigali", "Nyarugenge", "Gasabo", "Kicukiro", "Musanze", "Rubavu",
  "Burera", "Gicumbi", "Rulindo", "Karongi", "Rusizi", "Nyamasheke",
  "Huye", "Nyanza", "Nyagatare", "Rwamagana",
];

const DEFAULT_SUPPORTED_VARIETIES = [
  "Kinigi", "Cruza", "Victoria", "Kirundo", "Sangwe", "Mabondo",
];

const DEFAULT_PLATFORM_SETTINGS = {
  maintenance_mode: false,
  producer_registration_open: true,
  quote_expiry_days: 7,
  default_listing_unit: "kg",
  min_listing_price: 0,
  min_listing_quantity: 1,
  max_open_quotes_per_buyer: 10,
  quote_allowed_producers: true,
  quote_allowed_admins: true,
  quote_allowed_super_admins: true,
  review_sla_days: 5,
  seed_categories: DEFAULT_SEED_CATEGORIES,
  supported_varieties: DEFAULT_SUPPORTED_VARIETIES,
  supported_districts: DEFAULT_SUPPORTED_DISTRICTS,
  updated_at: null as string | null,
  updated_by: null as string | null,
};

const normalizeSeedCategories = (categories: unknown) => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return [...DEFAULT_SEED_CATEGORIES];
  }
  const seen = new Set<string>();
  const normalized = [];
  for (const item of categories) {
    if (!item || typeof item !== "object") continue;
    const value = String((item as any).value || "").trim();
    const label = String((item as any).label || "").trim();
    if (!value || !label || seen.has(value)) continue;
    seen.add(value);
    normalized.push({ value, label });
  }
  return normalized.length > 0 ? normalized : [...DEFAULT_SEED_CATEGORIES];
};

const normalizeDistricts = (districts: unknown) => {
  if (!Array.isArray(districts) || districts.length === 0) {
    return [...DEFAULT_SUPPORTED_DISTRICTS];
  }
  const seen = new Set<string>();
  const normalized = [];
  for (const d of districts) {
    const name = String(d || "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    normalized.push(name);
  }
  return normalized.length > 0 ? normalized : [...DEFAULT_SUPPORTED_DISTRICTS];
};

const normalizeVarieties = (varieties: unknown) => {
  if (!Array.isArray(varieties) || varieties.length === 0) {
    return [...DEFAULT_SUPPORTED_VARIETIES];
  }
  const seen = new Set<string>();
  const normalized = [];
  for (const v of varieties) {
    const name = String(v || "").trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    normalized.push(name);
  }
  return normalized.length > 0 ? normalized : [...DEFAULT_SUPPORTED_VARIETIES];
};

const DEFAULT_ADMIN_PREFS = {
  notify_new_access_request: true,
  notify_pending_escalation: true,
  notify_flagged_listing: true,
  default_landing_tab: "overview" as "overview" | "requests",
  rejection_templates: [
    "Incomplete documentation",
    "Invalid certification number",
    "Business information could not be verified",
    "Other — see internal notes",
  ],
};

const getPlatformSettings = async () => {
  const data = await kv.get(PLATFORM_SETTINGS_KEY);
  const stored = data ? parseStored(data) : {};
  const hasVarietiesKey =
    stored && typeof stored === "object" && "supported_varieties" in stored;
  return {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...stored,
    seed_categories: normalizeSeedCategories(stored.seed_categories),
    supported_varieties: hasVarietiesKey
      ? normalizeVarieties(stored.supported_varieties)
      : normalizeVarieties(DEFAULT_SUPPORTED_VARIETIES),
    supported_districts: normalizeDistricts(stored.supported_districts),
  };
};

const getAdminPrefs = async (userId: string) => {
  const data = await kv.get(`admin_prefs:${userId}`);
  if (!data) return { ...DEFAULT_ADMIN_PREFS };
  return { ...DEFAULT_ADMIN_PREFS, ...parseStored(data) };
};

const appendAuditLog = async (entry: {
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: string;
}) => {
  const id = `audit_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const log = { id, ...entry, created_at: new Date().toISOString() };
  await kv.set(`audit_log:${id}`, JSON.stringify(log));
  return log;
};

const getAdminProfile = async (authHeader: string | null) => {
  const user = await verifyUser(authHeader);
  if (!user) return null;
  const profileData = await kv.get(`user:${user.id}`);
  if (!profileData) return null;
  const profile = parseStored(profileData);
  if (!isAdminOrSuperAdmin(profile)) return null;
  return { user, profile };
};

const csvEscape = (value: unknown) => {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const isApprovedProducer = (profile: any) => {
  return (
    profile?.role === "producer" &&
    profile?.producer_verified === true &&
    profile?.suspended !== true
  );
};

const getProducerRating = async (producerId: string) => {
  const reviewsData = await kv.getByPrefix(`review:producer_${producerId}_`);
  const reviews = reviewsData.map(parseStored).filter(Boolean);
  if (reviews.length === 0) return { rating: null, reviewCount: 0 };
  const rating =
    reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) /
    reviews.length;
  return { rating, reviewCount: reviews.length };
};

const toMarketplaceListing = async (seed: any, producerProfile: any) => {
  const { rating, reviewCount } = await getProducerRating(seed.producer_id);
  return {
    ...seed,
    producer_name:
      seed.producer_name || producerProfile.business_name || producerProfile.name,
    location:
      seed.location || producerProfile.district || producerProfile.address || null,
    rating,
    reviews: reviewCount,
    certified: true,
    unit: seed.unit || "kg",
  };
};

const getMarketplaceSeeds = async () => {
  const rawSeeds = await kv.getByPrefix("seed:seed_");
  const activeSeeds = rawSeeds
    .map(parseStored)
    .filter((seed) => seed?.status === "active");

  const listings = [];
  for (const seed of activeSeeds) {
    const producerProfileData = await kv.get(`user:${seed.producer_id}`);
    if (!producerProfileData) continue;
    const producerProfile = parseStored(producerProfileData);
    if (!isApprovedProducer(producerProfile)) continue;
    listings.push(await toMarketplaceListing(seed, producerProfile));
  }

  listings.sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  );
  return listings;
};

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Public platform status (maintenance, registration gates)
app.get("/platform/public-status", async (c) => {
  try {
    const platform = await getPlatformSettings();
    return c.json({
      maintenance_mode: platform.maintenance_mode,
      producer_registration_open: platform.producer_registration_open,
    });
  } catch (error) {
    console.log("Public platform status error:", error);
    return c.json({ error: "Failed to get platform status" }, 500);
  }
});

// Public catalog (seed categories & districts for forms and filters)
app.get("/platform/catalog", async (c) => {
  try {
    const platform = await getPlatformSettings();
    return c.json({
      seed_categories: platform.seed_categories,
      supported_varieties: platform.supported_varieties,
      supported_districts: platform.supported_districts,
    });
  } catch (error) {
    console.log("Platform catalog error:", error);
    return c.json({ error: "Failed to get platform catalog" }, 500);
  }
});

// Check whether super admin setup is still available (ONE-TIME SETUP)
app.get("/init-super-admin/status", async (c) => {
  try {
    const superAdminExists = await hasSuperAdmin();
    return c.json({ available: !superAdminExists, super_admin_exists: superAdminExists });
  } catch (error) {
    console.log("Init super admin status error:", error);
    return c.json({ error: "Failed to check super admin status" }, 500);
  }
});

// Initialize first super admin (ONE-TIME SETUP)
app.post("/init-super-admin", async (c) => {
  try {
    if (await hasSuperAdmin()) {
      return c.json({ error: "A Super Admin account already exists. This setup page is no longer available." }, 403);
    }

    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const supabase = getSupabaseClient();

    // Create super admin user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      console.log('Auth super admin creation error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Store super admin profile in KV store
    const superAdminProfile = {
      id: authData.user.id,
      email,
      name,
      role: 'super_admin',
      created_at: new Date().toISOString(),
    };

    await kv.set(`user:${authData.user.id}`, JSON.stringify(superAdminProfile));
    await kv.set(`user_email:${email}`, authData.user.id);

    return c.json({ success: true, message: 'Super Admin account created successfully', user: superAdminProfile });
  } catch (error) {
    console.log('Init super admin error:', error);
    return c.json({ error: 'Failed to create super admin' }, 500);
  }
});

// AUTH ENDPOINTS

// Sign up (creates user account)
app.post("/auth/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const supabase = getSupabaseClient();

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since no email server configured
      user_metadata: { name },
    });

    if (authError) {
      console.log('Auth signup error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Store user profile in KV store
    const userProfile = {
      id: authData.user.id,
      email,
      name,
      role: role || 'buyer', // Default to buyer
      created_at: new Date().toISOString(),
    };

    await kv.set(`user:${authData.user.id}`, JSON.stringify(userProfile));
    await kv.set(`user_email:${email}`, authData.user.id);

    return c.json({ success: true, user: userProfile });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Get user profile
app.get("/auth/profile", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const profile = JSON.parse(profileData);
    return c.json({ profile });
  } catch (error) {
    console.log('Get profile error:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Update user profile
app.put("/auth/profile", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const profileData = await kv.get(`user:${user.id}`);

    if (!profileData) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const profile = JSON.parse(profileData);
    const updatedProfile = {
      ...profile,
      id: user.id,
      ...(updates.name !== undefined ? { name: updates.name } : {}),
    };

    await kv.set(`user:${user.id}`, JSON.stringify(updatedProfile));

    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.log('Update profile error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// PRODUCER ACCESS REQUEST ENDPOINTS

// Upload document file
app.post("/upload-document", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const docType = formData.get('type') as string;

    if (!file || !docType) {
      return c.json({ error: 'File and type are required' }, 400);
    }

    const supabase = getSupabaseClient();
    const fileName = `${user.id}/${docType}_${Date.now()}_${file.name}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('seedlink-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.log('Upload error:', error);
      return c.json({ error: 'Failed to upload file' }, 500);
    }

    // Get signed URL valid for 1 year
    const { data: urlData } = await supabase.storage
      .from('seedlink-documents')
      .createSignedUrl(fileName, 31536000); // 1 year

    return c.json({
      success: true,
      path: data.path,
      url: urlData?.signedUrl
    });
  } catch (error) {
    console.log('Document upload error:', error);
    return c.json({ error: 'Failed to upload document' }, 500);
  }
});

// Submit producer access request
app.post("/access-requests", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const platformSettings = await getPlatformSettings();
    if (!platformSettings.producer_registration_open) {
      return c.json({ error: 'Producer registration is currently closed' }, 403);
    }

    const requestData = await c.req.json();

    const accessRequest = {
      id: `req_${Date.now()}_${user.id}`,
      user_id: user.id,
      user_email: user.email,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      ...requestData,
    };

    await kv.set(`access_request:${accessRequest.id}`, JSON.stringify(accessRequest));
    await kv.set(`access_request_user:${user.id}`, accessRequest.id);

    sendProducerRequestReceivedEmail(accessRequest).catch((err) =>
      console.log("Producer received email error:", err),
    );

    return c.json({ success: true, request: accessRequest });
  } catch (error) {
    console.log('Access request error:', error);
    return c.json({ error: 'Failed to submit request' }, 500);
  }
});

// Get all access requests (admin only)
app.get("/access-requests", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = JSON.parse(profileData);
    if (!isAdminOrSuperAdmin(profile)) {
      return c.json({ error: 'Forbidden - Admin/Super Admin only' }, 403);
    }

    const requests = await kv.getByPrefix('access_request:req_');
    const parsedRequests = requests.map(r => JSON.parse(r));

    return c.json({ requests: parsedRequests });
  } catch (error) {
    console.log('Get access requests error:', error);
    return c.json({ error: 'Failed to get requests' }, 500);
  }
});

// Update access request status (admin only)
app.put("/access-requests/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = JSON.parse(profileData);
    if (!isAdminOrSuperAdmin(profile)) {
      return c.json({ error: 'Forbidden - Admin/Super Admin only' }, 403);
    }

    const requestId = c.req.param('id');
    const { status, reason, internal_notes } = await c.req.json();

    const requestData = await kv.get(`access_request:${requestId}`);
    if (!requestData) {
      return c.json({ error: 'Request not found' }, 404);
    }

    const request = JSON.parse(requestData);
    const previousStatus = request.status;
    request.status = status;
    request.reviewed_at = new Date().toISOString();
    request.reviewed_by = user.id;
    if (reason) request.reason = reason;
    if (internal_notes !== undefined) request.internal_notes = internal_notes;

    await kv.set(`access_request:${requestId}`, JSON.stringify(request));

    await appendAuditLog({
      actor_id: user.id,
      actor_name: profile.name || profile.email,
      actor_role: profile.role,
      action: status === "approved" ? "access_request_approved" : "access_request_rejected",
      target_type: "access_request",
      target_id: requestId,
      details: reason || undefined,
    });

    // If approved, update user role to producer
    if (status === 'approved') {
      const userProfileData = await kv.get(`user:${request.user_id}`);
      if (userProfileData) {
        const userProfile = JSON.parse(userProfileData);
        userProfile.role = 'producer';
        userProfile.producer_verified = true;
        userProfile.business_name = request.businessName;
        await kv.set(`user:${request.user_id}`, JSON.stringify(userProfile));
      }
    }

    if (status === "approved" && previousStatus !== "approved") {
      sendProducerRequestApprovedEmail(request).catch((err) =>
        console.log("Producer approved email error:", err),
      );
    } else if (status === "rejected" && previousStatus !== "rejected") {
      sendProducerRequestRejectedEmail(request, reason).catch((err) =>
        console.log("Producer rejected email error:", err),
      );
    }

    return c.json({ success: true, request });
  } catch (error) {
    console.log('Update request error:', error);
    return c.json({ error: 'Failed to update request' }, 500);
  }
});

// SEED LISTING ENDPOINTS

// Create seed listing (producer only)
app.post("/seeds", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = parseStored(profileData);
    if (profile.role !== 'producer') {
      return c.json({ error: 'Forbidden - Producer only' }, 403);
    }
    if (!profile.producer_verified) {
      return c.json({ error: 'Only approved producers can list seeds on the marketplace' }, 403);
    }
    if (profile.suspended) {
      return c.json({ error: 'Your producer account is suspended' }, 403);
    }

    const seedData = await c.req.json();
    const location = typeof seedData.location === "string" ? seedData.location.trim() : "";
    const deliveryDetails =
      typeof seedData.delivery_details === "string" ? seedData.delivery_details.trim() : "";

    if (!location) {
      return c.json({ error: "Seed location is required" }, 400);
    }
    if (!deliveryDetails) {
      return c.json({ error: "Delivery details are required" }, 400);
    }

    const seed = {
      id: `seed_${Date.now()}_${user.id}`,
      producer_id: user.id,
      producer_name: profile.business_name || profile.name,
      unit: 'kg',
      created_at: new Date().toISOString(),
      status: 'active',
      ...seedData,
      location,
      delivery_details: deliveryDetails,
    };

    await kv.set(`seed:${seed.id}`, JSON.stringify(seed));

    return c.json({ success: true, seed });
  } catch (error) {
    console.log('Create seed error:', error);
    return c.json({ error: 'Failed to create seed listing' }, 500);
  }
});

// Public marketplace: active seeds from approved producers only
app.get("/seeds", async (c) => {
  try {
    const platformSettings = await getPlatformSettings();
    if (platformSettings.maintenance_mode) {
      return c.json({ seeds: [], maintenance_mode: true });
    }
    const seeds = await getMarketplaceSeeds();
    return c.json({ seeds, maintenance_mode: false });
  } catch (error) {
    console.log('Get seeds error:', error);
    return c.json({ error: 'Failed to get seeds' }, 500);
  }
});

// Get seed by ID
app.get("/seeds/:id", async (c) => {
  try {
    const seedId = c.req.param('id');
    const seedData = await kv.get(`seed:${seedId}`);

    if (!seedData) {
      return c.json({ error: 'Seed not found' }, 404);
    }

    const seed = parseStored(seedData);
    const producerProfileData = await kv.get(`user:${seed.producer_id}`);
    if (!producerProfileData) {
      return c.json({ error: 'Seed not found' }, 404);
    }

    const producerProfile = parseStored(producerProfileData);

    // Determine requester (if any)
    const requester = await verifyUser(c.req.header('Authorization'));
    let requesterProfile = null;
    if (requester) {
      const reqProfileData = await kv.get(`user:${requester.id}`);
      if (reqProfileData) requesterProfile = parseStored(reqProfileData);
    }

    // Build producer info and reviews for seed detail
    const producerReviewData = await kv.getByPrefix(`review:producer_${seed.producer_id}_`);
    const producerReviews = producerReviewData.map(parseStored).filter(Boolean);
    const producerRating = producerReviews.length > 0
      ? producerReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / producerReviews.length
      : null;

    const producerInfo = {
      name: producerProfile.business_name || producerProfile.name,
      email: producerProfile.email,
      phone: producerProfile.phone || null,
      certifications: producerProfile.certificationBody ? [producerProfile.certificationBody] : [],
      since: producerProfile.created_at,
      location: producerProfile.district || producerProfile.address || null,
    };

    // Allow access if:
    // - the producer is verified OR
    // - the requester is the producer owner OR
    // - the requester is an admin/super_admin
    if (
      isApprovedProducer(producerProfile) ||
      (requester && requester.id === seed.producer_id) ||
      (requesterProfile && isAdminOrSuperAdmin(requesterProfile))
    ) {
      return c.json({ seed: { ...seed, producerInfo, producerRating, producerReviews } });
    }

    return c.json({ error: 'Seed not found' }, 404);
  } catch (error) {
    console.log('Get seed error:', error);
    return c.json({ error: 'Failed to get seed' }, 500);
  }
});

// Get seeds by producer
app.get("/seeds/producer/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const seeds = await kv.getByPrefix('seed:seed_');
    const producerSeeds = seeds
      .map(s => JSON.parse(s))
      .filter(s => s.producer_id === userId);

    return c.json({ seeds: producerSeeds });
  } catch (error) {
    console.log('Get producer seeds error:', error);
    return c.json({ error: 'Failed to get producer seeds' }, 500);
  }
});

// Get producer profile, seeds and reviews
app.get("/producers/:id", async (c) => {
  try {
    const producerId = c.req.param('id');
    const profileData = await kv.get(`user:${producerId}`);
    if (!profileData) {
      return c.json({ error: 'Producer not found' }, 404);
    }

    const producer = parseStored(profileData);
    if (producer.role !== 'producer') {
      return c.json({ error: 'Producer not found' }, 404);
    }

    const requester = await verifyUser(c.req.header('Authorization'));
    let requesterProfile = null;
    if (requester) {
      const reqProfileData = await kv.get(`user:${requester.id}`);
      if (reqProfileData) requesterProfile = parseStored(reqProfileData);
    }

    const isOwner = requester?.id === producerId;
    const isAdmin = requesterProfile && isAdminOrSuperAdmin(requesterProfile);
    if (!isApprovedProducer(producer) && !isOwner && !isAdmin) {
      return c.json({ error: 'Producer not found' }, 404);
    }

    const seeds = (await kv.getByPrefix('seed:seed_'))
      .map(parseStored)
      .filter((s) => s.producer_id === producerId && s.status === 'active');

    const reviewsData = await kv.getByPrefix(`review:producer_${producerId}_`);
    const reviews = reviewsData.map(r => JSON.parse(r));
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
      : null;

    return c.json({
      producer,
      seeds,
      reviews,
      averageRating,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.log('Get producer profile error:', error);
    return c.json({ error: 'Failed to get producer profile' }, 500);
  }
});

app.post("/producers/:id/reviews", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const producerId = c.req.param('id');
    if (user.id === producerId) {
      return c.json({ error: 'You cannot review your own profile' }, 403);
    }

    const producerProfileData = await kv.get(`user:${producerId}`);
    if (!producerProfileData) {
      return c.json({ error: 'Producer not found' }, 404);
    }

    const { rating, comment } = await c.req.json();
    if (!rating || !comment) {
      return c.json({ error: 'Rating and comment are required' }, 400);
    }

    const reviewerProfileData = await kv.get(`user:${user.id}`);
    const reviewerProfile = reviewerProfileData ? JSON.parse(reviewerProfileData) : null;
    const reviewerName = reviewerProfile?.business_name || reviewerProfile?.name || 'Buyer';

    const review = {
      id: `review:producer_${producerId}_${Date.now()}_${user.id}`,
      producer_id: producerId,
      reviewer_id: user.id,
      reviewer_name: reviewerName,
      rating: Number(rating),
      comment,
      created_at: new Date().toISOString(),
    };

    await kv.set(review.id, JSON.stringify(review));

    return c.json({ success: true, review });
  } catch (error) {
    console.log('Create producer review error:', error);
    return c.json({ error: 'Failed to submit review' }, 500);
  }
});

// Update seed listing
app.put("/seeds/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const seedId = c.req.param('id');
    const seedData = await kv.get(`seed:${seedId}`);

    if (!seedData) {
      return c.json({ error: 'Seed not found' }, 404);
    }

    const seed = parseStored(seedData);

    // Check if user owns this seed
    if (seed.producer_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updates = await c.req.json();
    if (updates.location !== undefined) {
      const location = typeof updates.location === "string" ? updates.location.trim() : "";
      if (!location) {
        return c.json({ error: "Seed location is required" }, 400);
      }
      updates.location = location;
    }
    if (updates.delivery_details !== undefined) {
      const deliveryDetails =
        typeof updates.delivery_details === "string" ? updates.delivery_details.trim() : "";
      if (!deliveryDetails) {
        return c.json({ error: "Delivery details are required" }, 400);
      }
      updates.delivery_details = deliveryDetails;
    }

    const updatedSeed = { ...seed, ...updates, id: seedId, producer_id: user.id };

    await kv.set(`seed:${seedId}`, JSON.stringify(updatedSeed));

    return c.json({ success: true, seed: updatedSeed });
  } catch (error) {
    console.log('Update seed error:', error);
    return c.json({ error: 'Failed to update seed' }, 500);
  }
});

// Delete seed listing
app.delete("/seeds/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const seedId = c.req.param('id');
    const seedData = await kv.get(`seed:${seedId}`);

    if (!seedData) {
      return c.json({ error: 'Seed not found' }, 404);
    }

    const seed = JSON.parse(seedData);

    // Check if user owns this seed
    if (seed.producer_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await kv.del(`seed:${seedId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete seed error:', error);
    return c.json({ error: 'Failed to delete seed' }, 500);
  }
});

// ORDER ENDPOINTS

// Create order
app.post("/orders", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderData = await c.req.json();

    const order = {
      id: `order_${Date.now()}_${user.id}`,
      buyer_id: user.id,
      status: 'pending',
      created_at: new Date().toISOString(),
      ...orderData,
    };

    await kv.set(`order:${order.id}`, JSON.stringify(order));

    return c.json({ success: true, order });
  } catch (error) {
    console.log('Create order error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Get user's orders
app.get("/orders/my-orders", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allOrders = await kv.getByPrefix('order:order_');
    const userOrders = allOrders
      .map(o => JSON.parse(o))
      .filter(o => o.buyer_id === user.id);

    return c.json({ orders: userOrders });
  } catch (error) {
    console.log('Get orders error:', error);
    return c.json({ error: 'Failed to get orders' }, 500);
  }
});

// Get producer's orders
app.get("/orders/producer-orders", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allOrders = await kv.getByPrefix('order:order_');
    const producerOrders = allOrders
      .map(o => JSON.parse(o))
      .filter(o => o.producer_id === user.id);

    return c.json({ orders: producerOrders });
  } catch (error) {
    console.log('Get producer orders error:', error);
    return c.json({ error: 'Failed to get orders' }, 500);
  }
});

// Update order status
app.put("/orders/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderId = c.req.param('id');
    const orderData = await kv.get(`order:${orderId}`);

    if (!orderData) {
      return c.json({ error: 'Order not found' }, 404);
    }

    const order = JSON.parse(orderData);
    const updates = await c.req.json();
    const updatedOrder = { ...order, ...updates };

    await kv.set(`order:${orderId}`, JSON.stringify(updatedOrder));

    return c.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.log('Update order error:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// QUOTE REQUEST ENDPOINTS (on-platform buyer ↔ producer conversation)

const getUserProfile = async (userId: string) => {
  const data = await kv.get(`user:${userId}`);
  return data ? parseStored(data) : null;
};

const displayName = (profile: any) =>
  profile?.business_name || profile?.name || "SeedLink user";

const canAccessQuote = (quote: any, userId: string) =>
  quote.buyer_id === userId || quote.producer_id === userId;

const ACTIVE_QUOTE_STATUSES = ["quote_requested", "quote_sent"];

// Create quote request (buyer / farmer)
app.post("/quote-requests", async (c) => {
  try {
    const user = await verifyUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const buyerProfile = await getUserProfile(user.id);
    if (!buyerProfile) return c.json({ error: "Profile not found" }, 404);

    const { seed_id, quantity, message } = await c.req.json();
    if (!seed_id || !quantity) {
      return c.json({ error: "Seed and quantity are required" }, 400);
    }

    const seedData = await kv.get(`seed:${seed_id}`);
    if (!seedData) return c.json({ error: "Listing not found" }, 404);
    const seed = parseStored(seedData);

    if (seed.producer_id === user.id) {
      return c.json({ error: "You cannot request a quote on your own listing" }, 403);
    }
    if (seed.status !== "active") {
      return c.json({ error: "This listing is not available" }, 400);
    }

    const listingProducer = await getUserProfile(seed.producer_id);
    if (!listingProducer || !isApprovedProducer(listingProducer)) {
      return c.json({ error: "This listing is not available from an approved producer" }, 400);
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return c.json({ error: "Invalid quantity" }, 400);
    }
    if (seed.minOrder && qty < seed.minOrder) {
      return c.json({ error: `Minimum order is ${seed.minOrder} kg` }, 400);
    }

    const existing = (await kv.getByPrefix("quote:quote_"))
      .map(parseStored)
      .find(
        (q) =>
          q.seed_id === seed_id &&
          q.buyer_id === user.id &&
          ACTIVE_QUOTE_STATUSES.includes(q.status),
      );
    if (existing) {
      return c.json({ error: "You already have an open quote for this listing", quote: existing }, 409);
    }

    const producerProfile = await getUserProfile(seed.producer_id);
    const now = new Date().toISOString();
    const initialMessage =
      typeof message === "string" && message.trim()
        ? message.trim()
        : `Quote request for ${qty} kg.`;

    const quote = {
      id: `quote_${Date.now()}_${user.id}`,
      seed_id,
      producer_id: seed.producer_id,
      buyer_id: user.id,
      buyer_name: displayName(buyerProfile),
      producer_name: seed.producer_name || displayName(producerProfile),
      seed_category: seed.category || null,
      seed_variety: seed.variety || null,
      quantity: qty,
      listed_unit_price: seed.price ?? 0,
      status: "quote_requested",
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender_id: user.id,
          sender_role: "buyer",
          sender_name: displayName(buyerProfile),
          body: initialMessage,
          created_at: now,
        },
      ],
      producer_quote: null,
      order_id: null,
      created_at: now,
      updated_at: now,
    };

    await kv.set(`quote:${quote.id}`, JSON.stringify(quote));
    return c.json({ success: true, quote });
  } catch (error) {
    console.log("Create quote request error:", error);
    return c.json({ error: "Failed to create quote request" }, 500);
  }
});

// Active quote for buyer on a listing
app.get("/quote-requests/seed/:seedId", async (c) => {
  try {
    const user = await verifyUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const seedId = c.req.param("seedId");
    const quote = (await kv.getByPrefix("quote:quote_"))
      .map(parseStored)
      .find(
        (q) =>
          q.seed_id === seedId &&
          q.buyer_id === user.id &&
          ACTIVE_QUOTE_STATUSES.includes(q.status),
      );

    return c.json({ quote: quote || null });
  } catch (error) {
    console.log("Get seed quote error:", error);
    return c.json({ error: "Failed to get quote" }, 500);
  }
});

// Buyer's quote requests
app.get("/quote-requests/my", async (c) => {
  try {
    const user = await verifyUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const quotes = (await kv.getByPrefix("quote:quote_"))
      .map(parseStored)
      .filter((q) => q.buyer_id === user.id)
      .sort(
        (a, b) =>
          new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime(),
      );

    return c.json({ quotes });
  } catch (error) {
    console.log("Get my quotes error:", error);
    return c.json({ error: "Failed to get quotes" }, 500);
  }
});

// Producer inbox
app.get("/quote-requests/inbox", async (c) => {
  try {
    const user = await verifyUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const quotes = (await kv.getByPrefix("quote:quote_"))
      .map(parseStored)
      .filter((q) => q.producer_id === user.id)
      .sort(
        (a, b) =>
          new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime(),
      );

    return c.json({ quotes });
  } catch (error) {
    console.log("Get producer quotes error:", error);
    return c.json({ error: "Failed to get quotes" }, 500);
  }
});

// Get single quote
app.get("/quote-requests/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const quoteId = c.req.param("id");
    const quoteData = await kv.get(`quote:${quoteId}`);
    if (!quoteData) return c.json({ error: "Quote not found" }, 404);

    const quote = parseStored(quoteData);
    if (!canAccessQuote(quote, user.id)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    return c.json({ quote });
  } catch (error) {
    console.log("Get quote error:", error);
    return c.json({ error: "Failed to get quote" }, 500);
  }
});

// Add message to thread
app.post("/quote-requests/:id/messages", async (c) => {
  try {
    const user = await verifyUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const quoteId = c.req.param("id");
    const quoteData = await kv.get(`quote:${quoteId}`);
    if (!quoteData) return c.json({ error: "Quote not found" }, 404);

    const quote = parseStored(quoteData);
    if (!canAccessQuote(quote, user.id)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    if (quote.status === "confirmed" || quote.status === "declined") {
      return c.json({ error: "This quote is closed" }, 400);
    }

    const { body } = await c.req.json();
    if (!body || typeof body !== "string" || !body.trim()) {
      return c.json({ error: "Message is required" }, 400);
    }

    const profile = await getUserProfile(user.id);
    const role = quote.buyer_id === user.id ? "buyer" : "producer";
    const now = new Date().toISOString();
    const msg = {
      id: `msg_${Date.now()}`,
      sender_id: user.id,
      sender_role: role,
      sender_name: displayName(profile),
      body: body.trim(),
      created_at: now,
    };

    quote.messages = [...(quote.messages || []), msg];
    quote.updated_at = now;
    await kv.set(`quote:${quoteId}`, JSON.stringify(quote));

    return c.json({ success: true, quote });
  } catch (error) {
    console.log("Quote message error:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

// Producer sends quote
app.put("/quote-requests/:id/respond", async (c) => {
  try {
    const user = await verifyUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const quoteId = c.req.param("id");
    const quoteData = await kv.get(`quote:${quoteId}`);
    if (!quoteData) return c.json({ error: "Quote not found" }, 404);

    const quote = parseStored(quoteData);
    if (quote.producer_id !== user.id) {
      return c.json({ error: "Only the producer can send a quote" }, 403);
    }
    if (!["quote_requested", "quote_sent"].includes(quote.status)) {
      return c.json({ error: "Cannot update this quote" }, 400);
    }

    const { unit_price, message } = await c.req.json();
    const unitPrice = Number(unit_price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return c.json({ error: "Valid unit price is required" }, 400);
    }

    const profile = await getUserProfile(user.id);
    const now = new Date().toISOString();
    const total = unitPrice * quote.quantity;
    const responseNote =
      typeof message === "string" && message.trim()
        ? message.trim()
        : `Quote: ${unitPrice.toLocaleString()} RWF/kg (${total.toLocaleString()} RWF total for ${quote.quantity} kg).`;

    quote.producer_quote = {
      unit_price: unitPrice,
      total,
      message: typeof message === "string" ? message.trim() : "",
      sent_at: now,
    };
    quote.status = "quote_sent";
    quote.messages = [
      ...(quote.messages || []),
      {
        id: `msg_${Date.now()}`,
        sender_id: user.id,
        sender_role: "producer",
        sender_name: displayName(profile),
        body: responseNote,
        created_at: now,
      },
    ];
    quote.updated_at = now;

    await kv.set(`quote:${quoteId}`, JSON.stringify(quote));
    return c.json({ success: true, quote });
  } catch (error) {
    console.log("Respond to quote error:", error);
    return c.json({ error: "Failed to send quote" }, 500);
  }
});

// Buyer confirms quote → order on SeedLink
app.put("/quote-requests/:id/confirm", async (c) => {
  try {
    const user = await verifyUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const quoteId = c.req.param("id");
    const quoteData = await kv.get(`quote:${quoteId}`);
    if (!quoteData) return c.json({ error: "Quote not found" }, 404);

    const quote = parseStored(quoteData);
    if (quote.buyer_id !== user.id) {
      return c.json({ error: "Only the buyer can confirm" }, 403);
    }
    if (quote.status !== "quote_sent" || !quote.producer_quote) {
      return c.json({ error: "Waiting for producer quote before you can confirm" }, 400);
    }

    const now = new Date().toISOString();
    const order = {
      id: `order_${Date.now()}_${user.id}`,
      buyer_id: user.id,
      producer_id: quote.producer_id,
      seed_id: quote.seed_id,
      seed_name: quote.seed_variety || quote.seed_category || "Seed listing",
      producer_name: quote.producer_name,
      quantity: quote.quantity,
      unit_price: quote.producer_quote.unit_price,
      total: quote.producer_quote.total,
      total_price: quote.producer_quote.unit_price,
      status: "confirmed",
      quote_id: quoteId,
      created_at: now,
    };

    await kv.set(`order:${order.id}`, JSON.stringify(order));

    const buyerProfile = await getUserProfile(user.id);
    quote.status = "confirmed";
    quote.order_id = order.id;
    quote.messages = [
      ...(quote.messages || []),
      {
        id: `msg_${Date.now()}`,
        sender_id: user.id,
        sender_role: "buyer",
        sender_name: displayName(buyerProfile),
        body: `Order confirmed on SeedLink for ${quote.producer_quote.total.toLocaleString()} RWF.`,
        created_at: now,
      },
    ];
    quote.updated_at = now;
    await kv.set(`quote:${quoteId}`, JSON.stringify(quote));

    return c.json({ success: true, quote, order });
  } catch (error) {
    console.log("Confirm quote error:", error);
    return c.json({ error: "Failed to confirm order" }, 500);
  }
});

// Decline / cancel quote
app.put("/quote-requests/:id/decline", async (c) => {
  try {
    const user = await verifyUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const quoteId = c.req.param("id");
    const quoteData = await kv.get(`quote:${quoteId}`);
    if (!quoteData) return c.json({ error: "Quote not found" }, 404);

    const quote = parseStored(quoteData);
    if (!canAccessQuote(quote, user.id)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    if (quote.status === "confirmed") {
      return c.json({ error: "Cannot decline a confirmed order" }, 400);
    }

    const profile = await getUserProfile(user.id);
    const now = new Date().toISOString();
    quote.status = "declined";
    quote.messages = [
      ...(quote.messages || []),
      {
        id: `msg_${Date.now()}`,
        sender_id: user.id,
        sender_role: quote.buyer_id === user.id ? "buyer" : "producer",
        sender_name: displayName(profile),
        body: "Quote request closed.",
        created_at: now,
      },
    ];
    quote.updated_at = now;
    await kv.set(`quote:${quoteId}`, JSON.stringify(quote));

    return c.json({ success: true, quote });
  } catch (error) {
    console.log("Decline quote error:", error);
    return c.json({ error: "Failed to decline quote" }, 500);
  }
});

// FAVORITES ENDPOINTS

// Add favorite producer
app.post("/favorites", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { producer_id } = await c.req.json();
    const favoriteId = `fav_${user.id}_${producer_id}`;

    const favorite = {
      id: favoriteId,
      user_id: user.id,
      producer_id,
      created_at: new Date().toISOString(),
    };

    await kv.set(`favorite:${favoriteId}`, JSON.stringify(favorite));

    return c.json({ success: true, favorite });
  } catch (error) {
    console.log('Add favorite error:', error);
    return c.json({ error: 'Failed to add favorite' }, 500);
  }
});

// Get user's favorites
app.get("/favorites", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allFavorites = await kv.getByPrefix(`favorite:fav_${user.id}_`);
    const favorites = allFavorites.map(f => JSON.parse(f));

    return c.json({ favorites });
  } catch (error) {
    console.log('Get favorites error:', error);
    return c.json({ error: 'Failed to get favorites' }, 500);
  }
});

// Remove favorite
app.delete("/favorites/:producer_id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const producerId = c.req.param('producer_id');
    const favoriteId = `fav_${user.id}_${producerId}`;

    await kv.del(`favorite:${favoriteId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Remove favorite error:', error);
    return c.json({ error: 'Failed to remove favorite' }, 500);
  }
});

// ADMIN ENDPOINTS

// Get all users (admin or super_admin only)
app.get("/admin/users", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = JSON.parse(profileData);
    if (!isAdminOrSuperAdmin(profile)) {
      return c.json({ error: 'Forbidden - Admin/Super Admin only' }, 403);
    }

    const users = await kv.getByPrefix('user:');
    const parsedUsers = users
      .filter(u => !u.includes('user_email:'))
      .map(u => JSON.parse(u));

    return c.json({ users: parsedUsers });
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// Get dashboard stats (admin only)
app.get("/admin/stats", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = JSON.parse(profileData);
    if (!isAdminOrSuperAdmin(profile)) {
      return c.json({ error: 'Forbidden - Admin/Super Admin only' }, 403);
    }

    const users = await kv.getByPrefix('user:');
    const seeds = await kv.getByPrefix('seed:');
    const orders = await kv.getByPrefix('order:');
    const requests = await kv.getByPrefix('access_request:req_');

    const parsedUsers = users.filter(u => !u.includes('user_email:')).map(u => JSON.parse(u));
    const parsedRequests = requests.map(r => JSON.parse(r));

    const stats = {
      total_users: parsedUsers.length,
      total_buyers: parsedUsers.filter(u => u.role === 'buyer').length,
      total_producers: parsedUsers.filter(u => u.role === 'producer').length,
      total_admins: parsedUsers.filter(u => u.role === 'admin').length,
      total_super_admins: parsedUsers.filter(u => u.role === 'super_admin').length,
      total_seeds: seeds.length,
      total_orders: orders.length,
      pending_requests: parsedRequests.filter(r => r.status === 'pending').length,
      approved_requests: parsedRequests.filter(r => r.status === 'approved').length,
      rejected_requests: parsedRequests.filter(r => r.status === 'rejected').length,
    };

    return c.json({ stats });
  } catch (error) {
    console.log('Get stats error:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

// SUPER ADMIN ENDPOINTS

// Create new user (super_admin only)
app.post("/super-admin/create-user", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = JSON.parse(profileData);
    if (profile.role !== 'super_admin') {
      return c.json({ error: 'Forbidden - Super Admin only' }, 403);
    }

    const { email, password, name, role } = await c.req.json();

    if (!email || !password || !name || !role) {
      return c.json({ error: 'Email, password, name, and role are required' }, 400);
    }

    const supabase = getSupabaseClient();

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      console.log('Create user error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Store user profile
    const userProfile = {
      id: authData.user.id,
      email,
      name,
      role,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };

    await kv.set(`user:${authData.user.id}`, JSON.stringify(userProfile));
    await kv.set(`user_email:${email}`, authData.user.id);

    await appendAuditLog({
      actor_id: user.id,
      actor_name: profile.name || profile.email,
      actor_role: profile.role,
      action: "user_created",
      target_type: "user",
      target_id: authData.user.id,
      details: `Created ${role} account for ${email}`,
    });

    return c.json({ success: true, user: userProfile });
  } catch (error) {
    console.log('Create user error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Change user role (super_admin only)
app.put("/super-admin/change-role/:userId", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = JSON.parse(profileData);
    if (profile.role !== 'super_admin') {
      return c.json({ error: 'Forbidden - Super Admin only' }, 403);
    }

    const userId = c.req.param('userId');
    const { newRole } = await c.req.json();

    if (!newRole) {
      return c.json({ error: 'New role is required' }, 400);
    }

    const targetUserData = await kv.get(`user:${userId}`);
    if (!targetUserData) {
      return c.json({ error: 'User not found' }, 404);
    }

    const targetUser = JSON.parse(targetUserData);
    const previousRole = targetUser.role;
    targetUser.role = newRole;
    targetUser.role_updated_at = new Date().toISOString();
    targetUser.role_updated_by = user.id;

    await kv.set(`user:${userId}`, JSON.stringify(targetUser));

    await appendAuditLog({
      actor_id: user.id,
      actor_name: profile.name || profile.email,
      actor_role: profile.role,
      action: "role_changed",
      target_type: "user",
      target_id: userId,
      details: `Changed role from ${previousRole} to ${newRole}`,
    });

    return c.json({ success: true, user: targetUser });
  } catch (error) {
    console.log('Change role error:', error);
    return c.json({ error: 'Failed to change role' }, 500);
  }
});

// Delete user account (super_admin only)
app.delete("/super-admin/delete-user/:userId", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = JSON.parse(profileData);
    if (profile.role !== 'super_admin') {
      return c.json({ error: 'Forbidden - Super Admin only' }, 403);
    }

    const userId = c.req.param('userId');

    // Prevent self-deletion
    if (userId === user.id) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    const targetUserData = await kv.get(`user:${userId}`);
    if (!targetUserData) {
      return c.json({ error: 'User not found' }, 404);
    }

    const targetUser = JSON.parse(targetUserData);

    // Delete from Supabase Auth
    const supabase = getSupabaseClient();
    await supabase.auth.admin.deleteUser(userId);

    // Delete from KV store
    await kv.del(`user:${userId}`);
    await kv.del(`user_email:${targetUser.email}`);

    await appendAuditLog({
      actor_id: user.id,
      actor_name: profile.name || profile.email,
      actor_role: profile.role,
      action: "user_deleted",
      target_type: "user",
      target_id: userId,
      details: `Deleted account ${targetUser.email}`,
    });

    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.log('Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Suspend/Terminate user (super_admin only)
app.put("/super-admin/suspend-user/:userId", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profileData = await kv.get(`user:${user.id}`);
    if (!profileData) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = JSON.parse(profileData);
    if (profile.role !== 'super_admin') {
      return c.json({ error: 'Forbidden - Super Admin only' }, 403);
    }

    const userId = c.req.param('userId');
    const { suspended, reason } = await c.req.json();

    if (userId === user.id) {
      return c.json({ error: 'Cannot suspend your own account' }, 400);
    }

    const targetUserData = await kv.get(`user:${userId}`);
    if (!targetUserData) {
      return c.json({ error: 'User not found' }, 404);
    }

    const targetUser = JSON.parse(targetUserData);
    targetUser.suspended = suspended;
    targetUser.suspension_reason = reason || null;
    targetUser.suspended_at = suspended ? new Date().toISOString() : null;
    targetUser.suspended_by = suspended ? user.id : null;

    await kv.set(`user:${userId}`, JSON.stringify(targetUser));

    await appendAuditLog({
      actor_id: user.id,
      actor_name: profile.name || profile.email,
      actor_role: profile.role,
      action: suspended ? "user_suspended" : "user_unsuspended",
      target_type: "user",
      target_id: userId,
      details: reason || undefined,
    });

    return c.json({ success: true, user: targetUser });
  } catch (error) {
    console.log('Suspend user error:', error);
    return c.json({ error: 'Failed to suspend user' }, 500);
  }
});

// ADMIN SETTINGS ENDPOINTS

app.get("/admin/settings/prefs", async (c) => {
  try {
    const admin = await getAdminProfile(c.req.header("Authorization"));
    if (!admin) return c.json({ error: "Forbidden - Admin/Super Admin only" }, 403);
    const prefs = await getAdminPrefs(admin.user.id);
    return c.json({ prefs });
  } catch (error) {
    console.log("Get admin prefs error:", error);
    return c.json({ error: "Failed to get admin preferences" }, 500);
  }
});

app.put("/admin/settings/prefs", async (c) => {
  try {
    const admin = await getAdminProfile(c.req.header("Authorization"));
    if (!admin) return c.json({ error: "Forbidden - Admin/Super Admin only" }, 403);

    const body = await c.req.json();
    const current = await getAdminPrefs(admin.user.id);
    const updated = {
      ...current,
      notify_new_access_request: body.notify_new_access_request ?? current.notify_new_access_request,
      notify_pending_escalation: body.notify_pending_escalation ?? current.notify_pending_escalation,
      notify_flagged_listing: body.notify_flagged_listing ?? current.notify_flagged_listing,
      default_landing_tab: body.default_landing_tab ?? current.default_landing_tab,
      rejection_templates: Array.isArray(body.rejection_templates)
        ? body.rejection_templates.filter((t: unknown) => typeof t === "string" && t.trim())
        : current.rejection_templates,
    };

    await kv.set(`admin_prefs:${admin.user.id}`, JSON.stringify(updated));
    return c.json({ success: true, prefs: updated });
  } catch (error) {
    console.log("Update admin prefs error:", error);
    return c.json({ error: "Failed to update admin preferences" }, 500);
  }
});

app.get("/admin/settings/platform", async (c) => {
  try {
    const admin = await getAdminProfile(c.req.header("Authorization"));
    if (!admin) return c.json({ error: "Forbidden - Admin/Super Admin only" }, 403);

    const platform = await getPlatformSettings();
    const initAvailable = !(await hasSuperAdmin());

    return c.json({
      platform,
      editable: admin.profile.role === "super_admin",
      init_super_admin_available: initAvailable,
    });
  } catch (error) {
    console.log("Get platform settings error:", error);
    return c.json({ error: "Failed to get platform settings" }, 500);
  }
});

app.put("/admin/settings/catalog", async (c) => {
  try {
    const admin = await getAdminProfile(c.req.header("Authorization"));
    if (!admin) return c.json({ error: "Forbidden - Admin/Super Admin only" }, 403);

    const body = await c.req.json();
    const current = await getPlatformSettings();
    const updated = {
      ...current,
      seed_categories: body.seed_categories !== undefined
        ? normalizeSeedCategories(body.seed_categories)
        : current.seed_categories,
      supported_varieties: body.supported_varieties !== undefined
        ? normalizeVarieties(body.supported_varieties)
        : current.supported_varieties,
      supported_districts: body.supported_districts !== undefined
        ? normalizeDistricts(body.supported_districts)
        : current.supported_districts,
      updated_at: new Date().toISOString(),
      updated_by: admin.user.id,
    };

    await kv.set(PLATFORM_SETTINGS_KEY, updated);

    await appendAuditLog({
      actor_id: admin.user.id,
      actor_name: admin.profile.name || admin.profile.email,
      actor_role: admin.profile.role,
      action: "platform_catalog_updated",
      target_type: "platform",
      target_id: PLATFORM_SETTINGS_KEY,
    });

    return c.json({ success: true, platform: updated });
  } catch (error) {
    console.log("Update platform catalog error:", error);
    return c.json({ error: "Failed to update platform catalog" }, 500);
  }
});

app.put("/super-admin/platform-settings", async (c) => {
  try {
    const admin = await getAdminProfile(c.req.header("Authorization"));
    if (!admin) return c.json({ error: "Forbidden - Super Admin only" }, 403);
    if (admin.profile.role !== "super_admin") {
      return c.json({ error: "Forbidden - Super Admin only" }, 403);
    }

    const body = await c.req.json();
    const current = await getPlatformSettings();
    const updated = {
      ...current,
      maintenance_mode: body.maintenance_mode ?? current.maintenance_mode,
      producer_registration_open: body.producer_registration_open ?? current.producer_registration_open,
      quote_expiry_days: Number(body.quote_expiry_days ?? current.quote_expiry_days),
      default_listing_unit: body.default_listing_unit ?? current.default_listing_unit,
      min_listing_price: Number(body.min_listing_price ?? current.min_listing_price),
      min_listing_quantity: Number(body.min_listing_quantity ?? current.min_listing_quantity),
      max_open_quotes_per_buyer: Number(body.max_open_quotes_per_buyer ?? current.max_open_quotes_per_buyer),
      quote_allowed_producers: body.quote_allowed_producers ?? current.quote_allowed_producers,
      quote_allowed_admins: body.quote_allowed_admins ?? current.quote_allowed_admins,
      quote_allowed_super_admins: body.quote_allowed_super_admins ?? current.quote_allowed_super_admins,
      review_sla_days: Number(body.review_sla_days ?? current.review_sla_days),
      seed_categories: body.seed_categories !== undefined
        ? normalizeSeedCategories(body.seed_categories)
        : current.seed_categories,
      supported_varieties: body.supported_varieties !== undefined
        ? normalizeVarieties(body.supported_varieties)
        : current.supported_varieties,
      supported_districts: body.supported_districts !== undefined
        ? normalizeDistricts(body.supported_districts)
        : current.supported_districts,
      updated_at: new Date().toISOString(),
      updated_by: admin.user.id,
    };

    await kv.set(PLATFORM_SETTINGS_KEY, updated);

    await appendAuditLog({
      actor_id: admin.user.id,
      actor_name: admin.profile.name || admin.profile.email,
      actor_role: admin.profile.role,
      action: "platform_settings_updated",
      target_type: "platform",
      target_id: PLATFORM_SETTINGS_KEY,
      details: JSON.stringify(body),
    });

    return c.json({ success: true, platform: updated });
  } catch (error) {
    console.log("Update platform settings error:", error);
    return c.json({ error: "Failed to update platform settings" }, 500);
  }
});

app.get("/admin/audit-log", async (c) => {
  try {
    const admin = await getAdminProfile(c.req.header("Authorization"));
    if (!admin) return c.json({ error: "Forbidden - Admin/Super Admin only" }, 403);

    const limit = Math.min(Number(c.req.query("limit") || 50), 200);
    const logsRaw = await kv.getByPrefix("audit_log:");
    const logs = logsRaw
      .map(parseStored)
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    const filtered =
      admin.profile.role === "super_admin"
        ? logs
        : logs.filter((log: any) => log.actor_id === admin.user.id);

    return c.json({ logs: filtered.slice(0, limit) });
  } catch (error) {
    console.log("Get audit log error:", error);
    return c.json({ error: "Failed to get audit log" }, 500);
  }
});

app.get("/super-admin/export/:type", async (c) => {
  try {
    const admin = await getAdminProfile(c.req.header("Authorization"));
    if (!admin || admin.profile.role !== "super_admin") {
      return c.json({ error: "Forbidden - Super Admin only" }, 403);
    }

    const type = c.req.param("type");
    let csv = "";
    let filename = "export.csv";

    if (type === "users") {
      const usersRaw = await kv.getByPrefix("user:");
      const users = usersRaw.map(parseStored).filter((u: any) => u?.id && u?.email);
      csv = [
        "id,email,name,role,created_at,suspended",
        ...users.map((u: any) =>
          [u.id, u.email, u.name, u.role, u.created_at, u.suspended ? "yes" : "no"].map(csvEscape).join(",")
        ),
      ].join("\n");
      filename = "seedlink-users.csv";
    } else if (type === "access-requests") {
      const requestsRaw = await kv.getByPrefix("access_request:req_");
      const requests = requestsRaw.map(parseStored).filter(Boolean);
      csv = [
        "id,user_email,businessName,ownerName,district,status,submitted_at,reviewed_at,reason",
        ...requests.map((r: any) =>
          [r.id, r.user_email, r.businessName, r.ownerName, r.district, r.status, r.submitted_at, r.reviewed_at || "", r.reason || ""].map(csvEscape).join(",")
        ),
      ].join("\n");
      filename = "seedlink-access-requests.csv";
    } else if (type === "quotes") {
      const quotesRaw = await kv.getByPrefix("quote:");
      const quotes = quotesRaw.map(parseStored).filter(Boolean);
      csv = [
        "id,seed_id,producer_id,buyer_id,quantity,status,created_at,updated_at",
        ...quotes.map((q: any) =>
          [q.id, q.seed_id, q.producer_id, q.buyer_id, q.quantity, q.status, q.created_at, q.updated_at].map(csvEscape).join(",")
        ),
      ].join("\n");
      filename = "seedlink-quotes.csv";
    } else {
      return c.json({ error: "Invalid export type. Use users, access-requests, or quotes." }, 400);
    }

    await appendAuditLog({
      actor_id: admin.user.id,
      actor_name: admin.profile.name || admin.profile.email,
      actor_role: admin.profile.role,
      action: "data_exported",
      target_type: "export",
      target_id: type,
    });

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.log("Export error:", error);
    return c.json({ error: "Failed to export data" }, 500);
  }
});

Deno.serve(app.fetch);
