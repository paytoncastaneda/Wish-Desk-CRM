import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull().default("view_only"), // 'admin', 'mod', 'gc', 'view_only'
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").notNull().default(true),
  permissions: jsonb("permissions").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const taskCategories = pgTable("task_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#6b7280"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  resource: text("resource").notNull(), // tasks, users, companies, reports, dashboard
  actions: jsonb("actions").notNull(), // {create: true, read: true, update: true, delete: true}
  conditions: jsonb("conditions"), // Additional conditions for access
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  taskName: text("task_name").notNull(),
  taskOwner: integer("assigned_to").references(() => users.id),
  category: text("category"),
  dateDue: timestamp("date_due"),
  expirationDate: timestamp("expiration_date"),
  priority: integer("priority").default(1),
  status: text("status").notNull().default("pending"),
  taskDetails: text("task_details"),
  assignToSidekick: boolean("assign_to_sidekick").default(false),
  
  // Future linking fields for relationships
  linkedSwUserId: integer("linked_sw_user_id").references(() => users.id),
  linkedSwCompanyId: integer("linked_sw_company_id"), // Future table
  linkedSwCrmProposalId: integer("linked_swcrm_proposal_id"), // Future table
  linkedSwCrmOpportunityId: integer("linked_swcrm_opportunity_id"), // Future table
  linkedSwCrmNotesId: integer("linked_swcrm_notes_id"), // Future table
  linkedSwCrmPromotionsId: integer("linked_swcrm_promotions_id"), // Future table
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const githubRepos = pgTable("github_repos", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").notNull().unique(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  language: text("language"),
  stars: integer("stars").default(0),
  forks: integer("forks").default(0),
  isPrivate: boolean("is_private").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const githubCommits = pgTable("github_commits", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").notNull(),
  sha: text("sha").notNull().unique(),
  message: text("message").notNull(),
  author: text("author").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  template: text("template"),
  templateId: integer("template"),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const swcrmOutreachTemplates = pgTable("swcrm_outreach_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  isGlobal: boolean("is_global").default(false),
  category: text("category").default("general"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const swcrmTemplateUsage = pgTable("swcrm_template_usage", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => swcrmOutreachTemplates.id),
  usedBy: integer("used_by").references(() => users.id),
  taskId: integer("task_id").references(() => tasks.id),
  recipientEmail: text("recipient_email"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  config: jsonb("config"),
  data: jsonb("data"),
  generatedAt: timestamp("generated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentation = pgTable("documentation", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  status: text("status").notNull().default("draft"),
  filePath: text("file_path"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sugarwish Company Tables
export const swUsers = pgTable("sw_users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").unique(),
  password: text("password"),
  rememberToken: text("remember_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  status: integer("status").default(0),
  isDeveloper: text("is_developer").default("N"),
  forCompany: text("for_company").default("no"),
  ccOnFile: integer("cc_on_file").default(0),
  loveLetters: integer("love_letters").default(0),
  phone: text("phone"),
  popupShownCompany: integer("popup_shown_company").default(0),
  companyOrders: integer("company_orders").default(0),
  referalCode: text("referal_code"),
  referalCodeUsage: text("referal_code_usage"),
  sms: integer("sms").default(0),
  salesRep: text("sales_rep"),
  clientLevel: text("client_level"),
  clientStatus: text("client_status"),
  contactType: text("contact_type"),
  emailDomain: text("email_domain"),
  trainingDate: timestamp("training_date"),
  trainingStatus: text("training_status"),
  industry: text("industry"),
  numOfEmployees: integer("num_of_employees"),
  mobilePhone: text("mobile_phone"),
  apiAccessToken: text("api_access_token"),
  apiAccess: integer("api_access").default(0),
  insightlyContactId: integer("insightly_contact_id"),
  userResponsible: text("user_responsible"),
  validated: integer("validated").default(0),
  signupSource: text("signup_source"),
  accountType: text("account_type"),
  lastCreditPurchase: timestamp("last_credit_purchase"),
  logout: integer("logout").default(0),
  klaviyoId: text("klaviyo_id"),
  userCreatedFrom: text("user_created_from"),
  phoneStatus: text("phone_status"),
  firstCall: text("first_call"),
  emailStatus: text("email_status"),
  textable: text("textable"),
  googleId: text("google_id"),
});

export const swCompany = pgTable("sw_company", {
  id: serial("id").primaryKey(),
  magentoName: text("magento_name"),
  slug: text("slug"),
  urlKey: text("url_key"),
  name: text("name"),
  shortname: text("shortname"),
  phone: text("phone"),
  country: text("country"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  billingEmails: text("billing_emails"),
  logo: text("logo"),
  discountPercent: integer("discount_percent"),
  redeemOnly: integer("redeem_only").default(0),
  secure: integer("secure").default(0),
  createdBy: text("created_by"),
  active: integer("active").default(1),
  notes: text("notes"),
  ccOnFile: integer("cc_on_file").default(0),
  sendConfirm: integer("send_confirm").default(0),
  newBuyerSite: integer("new_buyer_site").default(0),
  pricingSchedule: text("pricing_schedule"),
  productExclusion: text("product_exclusion"),
  invoiceByUser: integer("invoice_by_user").default(0),
  survey: text("survey"),
  makePublic: integer("make_public").default(0),
  disableAll: integer("disable_all").default(0),
  gifts: text("gifts"),
  giftsFrequency: text("gifts_frequency"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  newCompanyCredit: integer("new_company_credit").default(0),
  creditUsed: integer("credit_used").default(0),
  chargeMonthEnd: integer("charge_month_end").default(0),
  source: text("source"),
  showSpecialOrderPage: integer("show_special_order_page").default(0),
  headerImage: text("header_image"),
  specialOrderPageUrl: text("special_order_page_url"),
  emailDomain: text("email_domain"),
  privacyRestricted: integer("privacy_restricted").default(0),
  noFollowUp: integer("no_follow_up").default(0),
  paymentMethod: text("payment_method"),
  referredBy: text("referred_by"),
  referralSource: text("referral_source"),
  insightlyOrganizationId: integer("insightly_organization_id"),
  revenue: integer("revenue"),
  l30dRev: integer("l30d_rev"),
  l90dRev: integer("l90d_rev"),
  ytdRev: integer("ytd_rev"),
  lytdRev: integer("lytd_rev"),
  lastyearRev: integer("lastyear_rev"),
  f7dRev: integer("f7d_rev"),
  f30dRev: integer("f30d_rev"),
  firstOrderDate: timestamp("first_order_date"),
  showFavorite: integer("show_favorite").default(0),
  expeditedShipping: integer("expedited_shipping").default(0),
  makeawish: integer("makeawish").default(0),
  emailNotification: integer("email_notification").default(0),
  clientLevel: text("client_level"),
  corporateAcctStatus: text("corporate_acct_status"),
  domain: text("domain"),
  recordId: text("record_id"),
  salesRep: text("sales_rep"),
  industry: text("industry"),
  deletedBy: text("deleted_by"),
  deletedAt: timestamp("deleted_at"),
  inviteId: text("invite_id"),
  referredCompanyId: integer("referred_company_id"),
  referredByUserId: integer("referred_by_user_id"),
  customOnly: integer("custom_only").default(0),
  isSelfSignup: integer("is_self_signup").default(0),
  testAccount: integer("test_account").default(0),
  skipEcardSku: integer("skip_ecard_sku").default(0),
  internationalAllowed: integer("international_allowed").default(0),
  sendSms: integer("send_sms").default(0),
  userResponsible: text("user_responsible"),
  autoinvoice: integer("autoinvoice").default(0),
  expirationTerms: integer("expiration_terms"),
  validated: integer("validated").default(0),
  autocancel: text("autocancel"),
  addExpirationAllowed: integer("add_expiration_allowed").default(0),
  reason: integer("reason").default(0),
  giftCardsAllowed: integer("gift_cards_allowed").default(0),
  expirationPref: text("expiration_pref"),
  firstCall: text("first_call"),
  categoryRestricted: integer("category_restricted").default(0),
});

export const swCompanyUsersPivot = pgTable("sw_company_users_pivot", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => swCompany.id),
  userId: integer("user_id").references(() => swUsers.id),
  status: text("status").default("active"),
  accessLevel: text("access_level").default("user"),
  activationCode: text("activation_code"),
  activeDate: timestamp("active_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  revenue: integer("revenue"),
  l30dRev: integer("l30d_rev"),
  l90dRev: integer("l90d_rev"),
  ytdRev: integer("ytd_rev"),
  lytdRev: integer("lytd_rev"),
  lastyearRev: integer("lastyear_rev"),
  f7dRev: integer("f7d_rev"),
  f30dRev: integer("f30d_rev"),
  firstOrderDate: timestamp("first_order_date"),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => swCompany.id),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  status: text("status").notNull().default("open"), // open, won, lost
  value: integer("value").default(0),
  estimatedShipDate: timestamp("estimated_ship_date"),
  actualCloseDate: timestamp("actual_close_date"),
  probability: integer("probability").default(0), // 0-100
  stage: text("stage").default("prospecting"),
  notes: text("notes"),
  insightlyOpportunityId: integer("insightly_opportunity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  isActive: true,
  permissions: true,
});

export const insertTaskCategorySchema = createInsertSchema(taskCategories).pick({
  name: true,
  description: true,
  color: true,
  isActive: true,
  createdBy: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).pick({
  role: true,
  resource: true,
  actions: true,
  conditions: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  action: true,
  resource: true,
  resourceId: true,
  oldValues: true,
  newValues: true,
  ipAddress: true,
  userAgent: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  taskName: true,
  taskOwner: true,
  category: true,
  dateDue: true,
  expirationDate: true,
  priority: true,
  status: true,
  taskDetails: true,
  assignToSidekick: true,
  linkedSwUserId: true,
  linkedSwCompanyId: true,
  linkedSwCrmProposalId: true,
  linkedSwCrmOpportunityId: true,
  linkedSwCrmNotesId: true,
  linkedSwCrmPromotionsId: true,
});

export const insertGithubRepoSchema = createInsertSchema(githubRepos).pick({
  repoId: true,
  name: true,
  fullName: true,
  description: true,
  language: true,
  stars: true,
  forks: true,
  isPrivate: true,
});

export const insertGithubCommitSchema = createInsertSchema(githubCommits).pick({
  repoId: true,
  sha: true,
  message: true,
  author: true,
  date: true,
});

export const insertEmailSchema = createInsertSchema(emails).pick({
  to: true,
  subject: true,
  body: true,
  template: true,
  templateId: true,
});

export const insertSwcrmOutreachTemplateSchema = createInsertSchema(swcrmOutreachTemplates).pick({
  name: true,
  subject: true,
  htmlContent: true,
  assignedUserId: true,
  isGlobal: true,
  category: true,
  createdBy: true,
  isActive: true,
});

export const insertSwcrmTemplateUsageSchema = createInsertSchema(swcrmTemplateUsage).pick({
  templateId: true,
  usedBy: true,
  taskId: true,
  recipientEmail: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  title: true,
  type: true,
  description: true,
  config: true,
});

export const insertDocumentationSchema = createInsertSchema(documentation).pick({
  title: true,
  category: true,
  content: true,
  author: true,
  status: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).pick({
  name: true,
  companyId: true,
  assignedUserId: true,
  status: true,
  value: true,
  estimatedShipDate: true,
  actualCloseDate: true,
  probability: true,
  stage: true,
  notes: true,
  insightlyOpportunityId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTaskCategory = z.infer<typeof insertTaskCategorySchema>;
export type TaskCategory = typeof taskCategories.$inferSelect;

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertGithubRepo = z.infer<typeof insertGithubRepoSchema>;
export type GithubRepo = typeof githubRepos.$inferSelect;

export type InsertGithubCommit = z.infer<typeof insertGithubCommitSchema>;
export type GithubCommit = typeof githubCommits.$inferSelect;

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export type InsertSwcrmOutreachTemplate = z.infer<typeof insertSwcrmOutreachTemplateSchema>;
export type SwcrmOutreachTemplate = typeof swcrmOutreachTemplates.$inferSelect;

export type InsertSwcrmTemplateUsage = z.infer<typeof insertSwcrmTemplateUsageSchema>;
export type SwcrmTemplateUsage = typeof swcrmTemplateUsage.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertDocumentation = z.infer<typeof insertDocumentationSchema>;
export type Documentation = typeof documentation.$inferSelect;

export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;
