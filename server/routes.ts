import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertPatientSchema, insertTreatmentPlanSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|dcm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and medical files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Simple session management
const sessions = new Map<string, { userId: string; expires: Date }>();

const generateSessionId = () => Math.random().toString(36).substring(7);

const authenticateUser = async (req: any, res: any, next: any) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const session = sessions.get(sessionId);
  if (!session || session.expires < new Date()) {
    sessions.delete(sessionId);
    return res.status(401).json({ message: "Session expired" });
  }
  
  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  
  req.user = user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { confirmPassword, ...userData } = validatedData;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Create session
      const sessionId = generateSessionId();
      sessions.set(sessionId, {
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      res.json({ user: { ...user, password: undefined }, sessionId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create session
      const sessionId = generateSessionId();
      sessions.set(sessionId, {
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      res.json({ user: { ...user, password: undefined }, sessionId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/auth/logout", authenticateUser, async (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out successfully" });
  });
  
  app.get("/api/auth/me", authenticateUser, async (req, res) => {
    res.json({ user: { ...req.user, password: undefined } });
  });
  
  app.put("/api/auth/role", authenticateUser, async (req, res) => {
    try {
      const { currentRole } = req.body;
      if (!req.user.roles.includes(currentRole)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUser(req.user.id, { currentRole });
      res.json({ user: { ...updatedUser, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Failed to update role" });
    }
  });
  
  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateUser, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id, req.user.currentRole);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });
  
  app.get("/api/dashboard/activities", authenticateUser, async (req, res) => {
    try {
      let activities;
      if (req.user.currentRole === "clinician") {
        activities = await storage.getActivitiesByClinic(req.user.id);
      } else {
        activities = await storage.getActivitiesByUser(req.user.id);
      }
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });
  
  // Consultant routes
  app.get("/api/consultants", authenticateUser, async (req, res) => {
    try {
      if (req.user.currentRole !== "clinician") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const consultants = await storage.getConsultantsByClinic(req.user.id);
      const consultantsWithUsers = await Promise.all(
        consultants.map(async (consultant) => {
          const user = await storage.getUser(consultant.userId);
          const patients = await storage.getPatientsByConsultant(consultant.id);
          return {
            ...consultant,
            user,
            patientCount: patients.length
          };
        })
      );
      
      res.json(consultantsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get consultants" });
    }
  });
  
  app.post("/api/consultants", authenticateUser, async (req, res) => {
    try {
      if (req.user.currentRole !== "clinician") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { userId, specialty, nextVisit } = req.body;
      
      // Check if consultant relationship already exists
      const existing = await storage.getConsultantByUserAndClinic(userId, req.user.id);
      if (existing) {
        return res.status(400).json({ message: "Consultant already exists for this clinic" });
      }
      
      const consultant = await storage.createConsultant({
        userId,
        clinicId: req.user.id,
        specialty,
        nextVisit: nextVisit ? new Date(nextVisit) : null,
        isActive: true
      });
      
      await storage.createActivity({
        userId: req.user.id,
        action: "consultant_added",
        description: `Added new consultant: ${specialty}`,
        metadata: { consultantId: consultant.id }
      });
      
      res.json(consultant);
    } catch (error) {
      res.status(500).json({ message: "Failed to create consultant" });
    }
  });
  
  // Patient routes
  app.get("/api/patients", authenticateUser, async (req, res) => {
    try {
      let patients;
      
      if (req.user.currentRole === "clinician") {
        patients = await storage.getPatientsByClinic(req.user.id);
      } else {
        // Get all consultant records for this user
        const consultantRecords = Array.from(await storage.getConsultantsByClinic("")).filter(c => c.userId === req.user.id);
        patients = [];
        for (const consultant of consultantRecords) {
          const consultantPatients = await storage.getPatientsByConsultant(consultant.id);
          patients.push(...consultantPatients);
        }
      }
      
      // Enrich with consultant and clinic info
      const enrichedPatients = await Promise.all(
        patients.map(async (patient) => {
          const consultant = await storage.getConsultant(patient.consultantId);
          const consultantUser = consultant ? await storage.getUser(consultant.userId) : null;
          const clinic = await storage.getUser(patient.clinicId);
          
          return {
            ...patient,
            consultant: consultantUser,
            clinic
          };
        })
      );
      
      res.json(enrichedPatients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get patients" });
    }
  });
  
  app.get("/api/patients/:id", authenticateUser, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Check access permissions
      const hasAccess = req.user.currentRole === "clinician" 
        ? patient.clinicId === req.user.id
        : await storage.getConsultantByUserAndClinic(req.user.id, patient.clinicId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const treatmentPlans = await storage.getTreatmentPlansByPatient(patient.id);
      const medicalImages = await storage.getMedicalImagesByPatient(patient.id);
      const payments = await storage.getPaymentsByPatient(patient.id);
      
      res.json({
        ...patient,
        treatmentPlans,
        medicalImages,
        payments
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get patient" });
    }
  });
  
  app.post("/api/patients", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patientId = await storage.getNextPatientId();
      
      const patient = await storage.createPatient({
        ...validatedData,
        patientId,
        clinicId: req.user.currentRole === "clinician" ? req.user.id : validatedData.clinicId
      });
      
      await storage.createActivity({
        userId: req.user.id,
        patientId: patient.id,
        action: "patient_created",
        description: `Created new patient: ${patient.name}`,
        metadata: { patientId: patient.id }
      });
      
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });
  
  app.put("/api/patients/:id", authenticateUser, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      const updatedPatient = await storage.updatePatient(req.params.id, req.body);
      
      await storage.createActivity({
        userId: req.user.id,
        patientId: patient.id,
        action: "patient_updated",
        description: `Updated patient: ${patient.name}`,
        metadata: { patientId: patient.id, updates: Object.keys(req.body) }
      });
      
      res.json(updatedPatient);
    } catch (error) {
      res.status(500).json({ message: "Failed to update patient" });
    }
  });
  
  // Treatment plan routes
  app.post("/api/patients/:patientId/treatment-plans", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertTreatmentPlanSchema.parse({
        ...req.body,
        patientId: req.params.patientId
      });
      
      const treatmentPlan = await storage.createTreatmentPlan(validatedData);
      
      await storage.createActivity({
        userId: req.user.id,
        patientId: req.params.patientId,
        action: "treatment_plan_created",
        description: `Created treatment plan step: ${treatmentPlan.title}`,
        metadata: { treatmentPlanId: treatmentPlan.id }
      });
      
      res.json(treatmentPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create treatment plan" });
    }
  });
  
  app.put("/api/treatment-plans/:id", authenticateUser, async (req, res) => {
    try {
      const treatmentPlan = await storage.updateTreatmentPlan(req.params.id, req.body);
      if (!treatmentPlan) {
        return res.status(404).json({ message: "Treatment plan not found" });
      }
      
      await storage.createActivity({
        userId: req.user.id,
        patientId: treatmentPlan.patientId,
        action: "treatment_plan_updated",
        description: `Updated treatment plan: ${treatmentPlan.title}`,
        metadata: { treatmentPlanId: treatmentPlan.id }
      });
      
      res.json(treatmentPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update treatment plan" });
    }
  });
  
  // Payment routes
  app.post("/api/patients/:patientId/payments", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse({
        ...req.body,
        patientId: req.params.patientId,
        recordedBy: req.user.id
      });
      
      const payment = await storage.createPayment(validatedData);
      
      // Update patient payment status
      const patient = await storage.getPatient(req.params.patientId);
      if (patient) {
        const newAmountPaid = parseFloat(patient.amountPaid) + parseFloat(payment.amount);
        const totalCost = parseFloat(patient.totalCost);
        const paymentStatus = newAmountPaid >= totalCost ? "completed" : "current";
        
        await storage.updatePatient(req.params.patientId, {
          amountPaid: String(newAmountPaid),
          paymentStatus
        });
      }
      
      await storage.createActivity({
        userId: req.user.id,
        patientId: req.params.patientId,
        action: "payment_recorded",
        description: `Recorded payment: $${payment.amount}`,
        metadata: { paymentId: payment.id, amount: payment.amount }
      });
      
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to record payment" });
    }
  });
  
  // Medical image routes
  app.post("/api/patients/:patientId/images", authenticateUser, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { imageType } = req.body;
      
      const medicalImage = await storage.createMedicalImage({
        patientId: req.params.patientId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        imageType: imageType || 'other',
        uploadedBy: req.user.id
      });
      
      await storage.createActivity({
        userId: req.user.id,
        patientId: req.params.patientId,
        action: "image_uploaded",
        description: `Uploaded ${imageType || 'medical'} image: ${req.file.originalname}`,
        metadata: { imageId: medicalImage.id, imageType }
      });
      
      res.json(medicalImage);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  
  app.delete("/api/images/:id", authenticateUser, async (req, res) => {
    try {
      const image = await storage.getMedicalImage(req.params.id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      const deleted = await storage.deleteMedicalImage(req.params.id);
      if (deleted) {
        await storage.createActivity({
          userId: req.user.id,
          patientId: image.patientId,
          action: "image_deleted",
          description: `Deleted medical image: ${image.originalName}`,
          metadata: { imageId: image.id }
        });
      }
      
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
