import { type User, type InsertUser, type Consultant, type InsertConsultant, type Patient, type InsertPatient, type TreatmentPlan, type InsertTreatmentPlan, type MedicalImage, type InsertMedicalImage, type Payment, type InsertPayment, type Activity, type InsertActivity } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Consultants
  getConsultant(id: string): Promise<Consultant | undefined>;
  getConsultantsByClinic(clinicId: string): Promise<Consultant[]>;
  getConsultantByUserAndClinic(userId: string, clinicId: string): Promise<Consultant | undefined>;
  createConsultant(consultant: InsertConsultant): Promise<Consultant>;
  updateConsultant(id: string, updates: Partial<Consultant>): Promise<Consultant | undefined>;

  // Patients
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientsByClinic(clinicId: string): Promise<Patient[]>;
  getPatientsByConsultant(consultantId: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined>;
  getNextPatientId(): Promise<string>;

  // Treatment Plans
  getTreatmentPlan(id: string): Promise<TreatmentPlan | undefined>;
  getTreatmentPlansByPatient(patientId: string): Promise<TreatmentPlan[]>;
  createTreatmentPlan(treatmentPlan: InsertTreatmentPlan): Promise<TreatmentPlan>;
  updateTreatmentPlan(id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan | undefined>;

  // Medical Images
  getMedicalImage(id: string): Promise<MedicalImage | undefined>;
  getMedicalImagesByPatient(patientId: string): Promise<MedicalImage[]>;
  createMedicalImage(medicalImage: InsertMedicalImage): Promise<MedicalImage>;
  deleteMedicalImage(id: string): Promise<boolean>;

  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByPatient(patientId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Activities
  getActivitiesByUser(userId: string): Promise<Activity[]>;
  getActivitiesByClinic(clinicId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard stats
  getDashboardStats(userId: string, role: string): Promise<{
    activePatients: number;
    consultants: number;
    appointments: number;
    revenue: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private consultants: Map<string, Consultant>;
  private patients: Map<string, Patient>;
  private treatmentPlans: Map<string, TreatmentPlan>;
  private medicalImages: Map<string, MedicalImage>;
  private payments: Map<string, Payment>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.consultants = new Map();
    this.patients = new Map();
    this.treatmentPlans = new Map();
    this.medicalImages = new Map();
    this.payments = new Map();
    this.activities = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Consultants
  async getConsultant(id: string): Promise<Consultant | undefined> {
    return this.consultants.get(id);
  }

  async getConsultantsByClinic(clinicId: string): Promise<Consultant[]> {
    return Array.from(this.consultants.values()).filter(consultant => 
      consultant.clinicId === clinicId && consultant.isActive
    );
  }

  async getConsultantByUserAndClinic(userId: string, clinicId: string): Promise<Consultant | undefined> {
    return Array.from(this.consultants.values()).find(consultant => 
      consultant.userId === userId && consultant.clinicId === clinicId
    );
  }

  async createConsultant(insertConsultant: InsertConsultant): Promise<Consultant> {
    const id = randomUUID();
    const consultant: Consultant = {
      ...insertConsultant,
      id,
      createdAt: new Date(),
    };
    this.consultants.set(id, consultant);
    return consultant;
  }

  async updateConsultant(id: string, updates: Partial<Consultant>): Promise<Consultant | undefined> {
    const consultant = this.consultants.get(id);
    if (!consultant) return undefined;
    
    const updatedConsultant = { ...consultant, ...updates };
    this.consultants.set(id, updatedConsultant);
    return updatedConsultant;
  }

  // Patients
  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientsByClinic(clinicId: string): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(patient => patient.clinicId === clinicId);
  }

  async getPatientsByConsultant(consultantId: string): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(patient => patient.consultantId === consultantId);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const now = new Date();
    const patient: Patient = {
      ...insertPatient,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient = { ...patient, ...updates, updatedAt: new Date() };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async getNextPatientId(): Promise<string> {
    const patients = Array.from(this.patients.values());
    const maxId = patients.reduce((max, patient) => {
      const num = parseInt(patient.patientId);
      return num > max ? num : max;
    }, 0);
    return String(maxId + 1).padStart(5, '0');
  }

  // Treatment Plans
  async getTreatmentPlan(id: string): Promise<TreatmentPlan | undefined> {
    return this.treatmentPlans.get(id);
  }

  async getTreatmentPlansByPatient(patientId: string): Promise<TreatmentPlan[]> {
    return Array.from(this.treatmentPlans.values())
      .filter(plan => plan.patientId === patientId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  async createTreatmentPlan(insertTreatmentPlan: InsertTreatmentPlan): Promise<TreatmentPlan> {
    const id = randomUUID();
    const treatmentPlan: TreatmentPlan = {
      ...insertTreatmentPlan,
      id,
      createdAt: new Date(),
    };
    this.treatmentPlans.set(id, treatmentPlan);
    return treatmentPlan;
  }

  async updateTreatmentPlan(id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan | undefined> {
    const treatmentPlan = this.treatmentPlans.get(id);
    if (!treatmentPlan) return undefined;
    
    const updatedTreatmentPlan = { ...treatmentPlan, ...updates };
    this.treatmentPlans.set(id, updatedTreatmentPlan);
    return updatedTreatmentPlan;
  }

  // Medical Images
  async getMedicalImage(id: string): Promise<MedicalImage | undefined> {
    return this.medicalImages.get(id);
  }

  async getMedicalImagesByPatient(patientId: string): Promise<MedicalImage[]> {
    return Array.from(this.medicalImages.values())
      .filter(image => image.patientId === patientId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async createMedicalImage(insertMedicalImage: InsertMedicalImage): Promise<MedicalImage> {
    const id = randomUUID();
    const medicalImage: MedicalImage = {
      ...insertMedicalImage,
      id,
      uploadedAt: new Date(),
    };
    this.medicalImages.set(id, medicalImage);
    return medicalImage;
  }

  async deleteMedicalImage(id: string): Promise<boolean> {
    return this.medicalImages.delete(id);
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByPatient(patientId: string): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.patientId === patientId)
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = {
      ...insertPayment,
      id,
      paymentDate: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  // Activities
  async getActivitiesByUser(userId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  async getActivitiesByClinic(clinicId: string): Promise<Activity[]> {
    const clinicPatients = await this.getPatientsByClinic(clinicId);
    const patientIds = new Set(clinicPatients.map(p => p.id));
    
    return Array.from(this.activities.values())
      .filter(activity => !activity.patientId || patientIds.has(activity.patientId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Dashboard stats
  async getDashboardStats(userId: string, role: string): Promise<{
    activePatients: number;
    consultants: number;
    appointments: number;
    revenue: number;
  }> {
    if (role === "clinician") {
      const patients = await this.getPatientsByClinic(userId);
      const consultants = await this.getConsultantsByClinic(userId);
      const payments = Array.from(this.payments.values()).filter(payment => 
        patients.some(p => p.id === payment.patientId)
      );
      
      const revenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const appointments = patients.filter(p => p.nextAppointment && p.nextAppointment > new Date()).length;
      
      return {
        activePatients: patients.filter(p => p.treatmentStatus === "active").length,
        consultants: consultants.length,
        appointments,
        revenue,
      };
    } else {
      // Consultant view
      const consultantRecords = Array.from(this.consultants.values()).filter(c => c.userId === userId);
      const patients = Array.from(this.patients.values()).filter(p => 
        consultantRecords.some(c => c.id === p.consultantId)
      );
      const payments = Array.from(this.payments.values()).filter(payment => 
        patients.some(p => p.id === payment.patientId)
      );
      
      const revenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const appointments = patients.filter(p => p.nextAppointment && p.nextAppointment > new Date()).length;
      
      return {
        activePatients: patients.filter(p => p.treatmentStatus === "active").length,
        consultants: consultantRecords.filter(c => c.isActive).length,
        appointments,
        revenue,
      };
    }
  }
}

export const storage = new MemStorage();
