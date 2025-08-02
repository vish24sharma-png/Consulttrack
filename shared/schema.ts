import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  roles: text("roles").array().notNull(), // ["clinician", "consultant"]
  currentRole: text("current_role").notNull(),
  specialty: text("specialty"), // for consultants
  clinicName: text("clinic_name"), // for clinicians
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Consultants table - for tracking consultant-clinic relationships
export const consultants = pgTable("consultants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clinicId: varchar("clinic_id").references(() => users.id).notNull(),
  specialty: text("specialty").notNull(),
  nextVisit: timestamp("next_visit"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: text("patient_id").notNull(), // e.g., "00124"
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  consultantId: varchar("consultant_id").references(() => consultants.id).notNull(),
  clinicId: varchar("clinic_id").references(() => users.id).notNull(),
  chiefComplaint: text("chief_complaint"),
  treatmentType: text("treatment_type").notNull(),
  treatmentStatus: text("treatment_status").default("active").notNull(), // active, completed, on-hold
  progressPercentage: integer("progress_percentage").default(0).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0").notNull(),
  paymentStatus: text("payment_status").default("pending").notNull(), // current, overdue, completed
  nextAppointment: timestamp("next_appointment"),
  clinicalNotes: text("clinical_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Treatment plans table
export const treatmentPlans = pgTable("treatment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("scheduled").notNull(), // scheduled, completed, cancelled
  paymentRequired: boolean("payment_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Medical images table
export const medicalImages = pgTable("medical_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  imageType: text("image_type").notNull(), // x-ray, intraoral, extraoral, progress
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  treatmentPlanId: varchar("treatment_plan_id").references(() => treatmentPlans.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: text("payment_method").notNull(),
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => users.id).notNull(),
});

// Activities table for audit trail
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  patientId: varchar("patient_id").references(() => patients.id),
  action: text("action").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertConsultantSchema = createInsertSchema(consultants).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTreatmentPlanSchema = createInsertSchema(treatmentPlans).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalImageSchema = createInsertSchema(medicalImages).omit({
  id: true,
  uploadedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  paymentDate: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Consultant = typeof consultants.$inferSelect;
export type InsertConsultant = z.infer<typeof insertConsultantSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type TreatmentPlan = typeof treatmentPlans.$inferSelect;
export type InsertTreatmentPlan = z.infer<typeof insertTreatmentPlanSchema>;
export type MedicalImage = typeof medicalImages.$inferSelect;
export type InsertMedicalImage = z.infer<typeof insertMedicalImageSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
