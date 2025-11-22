/**
 * Clinics API Client
 *
 * CRUD operations for clinic and doctor management.
 *
 * File: apps/aurity/lib/api/clinics.ts
 * Card: FI-CHECKIN-002
 * Created: 2025-11-22
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:7001";

// =============================================================================
// TYPES
// =============================================================================

export interface Clinic {
  clinic_id: string;
  name: string;
  specialty: string;
  timezone: string;
  welcome_message: string | null;
  primary_color: string | null;
  logo_url: string | null;
  checkin_qr_enabled: boolean;
  chat_enabled: boolean;
  payments_enabled: boolean;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ClinicCreate {
  name: string;
  specialty?: string;
  timezone?: string;
  welcome_message?: string;
  primary_color?: string;
  logo_url?: string;
  checkin_qr_enabled?: boolean;
  chat_enabled?: boolean;
  payments_enabled?: boolean;
  subscription_plan?: string;
}

export interface ClinicUpdate {
  name?: string;
  specialty?: string;
  timezone?: string;
  welcome_message?: string;
  primary_color?: string;
  logo_url?: string;
  checkin_qr_enabled?: boolean;
  chat_enabled?: boolean;
  payments_enabled?: boolean;
  subscription_plan?: string;
}

export interface Doctor {
  doctor_id: string;
  clinic_id: string;
  nombre: string;
  apellido: string;
  display_name: string | null;
  especialidad: string | null;
  cedula_profesional: string | null;
  email: string | null;
  phone: string | null;
  avg_consultation_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DoctorCreate {
  nombre: string;
  apellido: string;
  display_name?: string;
  especialidad?: string;
  cedula_profesional?: string;
  email?: string;
  phone?: string;
  avg_consultation_minutes?: number;
}

export interface DoctorUpdate {
  nombre?: string;
  apellido?: string;
  display_name?: string;
  especialidad?: string;
  cedula_profesional?: string;
  email?: string;
  phone?: string;
  avg_consultation_minutes?: number;
  is_active?: boolean;
}

export interface Appointment {
  appointment_id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  estimated_duration: number;
  appointment_type: string;
  status: string;
  checkin_code: string;
  checkin_code_expires_at: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface AppointmentCreate {
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  appointment_type?: string;
  estimated_duration?: number;
  reason?: string;
  notes?: string;
}

// =============================================================================
// CLINIC ENDPOINTS
// =============================================================================

export async function fetchClinics(activeOnly = true): Promise<Clinic[]> {
  const url = `${API_BASE}/api/clinics?active_only=${activeOnly}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch clinics: ${response.statusText}`);
  }

  const data = await response.json();
  return data.clinics;
}

export async function fetchClinic(clinicId: string): Promise<Clinic> {
  const url = `${API_BASE}/api/clinics/${clinicId}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch clinic: ${response.statusText}`);
  }

  return response.json();
}

export async function createClinic(data: ClinicCreate): Promise<Clinic> {
  const url = `${API_BASE}/api/clinics`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create clinic: ${response.statusText}`);
  }

  return response.json();
}

export async function updateClinic(clinicId: string, data: ClinicUpdate): Promise<Clinic> {
  const url = `${API_BASE}/api/clinics/${clinicId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update clinic: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteClinic(clinicId: string): Promise<void> {
  const url = `${API_BASE}/api/clinics/${clinicId}`;
  const response = await fetch(url, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(`Failed to delete clinic: ${response.statusText}`);
  }
}

// =============================================================================
// DOCTOR ENDPOINTS
// =============================================================================

export async function fetchDoctors(clinicId: string, activeOnly = true): Promise<Doctor[]> {
  const url = `${API_BASE}/api/clinics/${clinicId}/doctors?active_only=${activeOnly}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch doctors: ${response.statusText}`);
  }

  const data = await response.json();
  return data.doctors;
}

export async function fetchDoctor(clinicId: string, doctorId: string): Promise<Doctor> {
  const url = `${API_BASE}/api/clinics/${clinicId}/doctors/${doctorId}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch doctor: ${response.statusText}`);
  }

  return response.json();
}

export async function createDoctor(clinicId: string, data: DoctorCreate): Promise<Doctor> {
  const url = `${API_BASE}/api/clinics/${clinicId}/doctors`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create doctor: ${response.statusText}`);
  }

  return response.json();
}

export async function updateDoctor(clinicId: string, doctorId: string, data: DoctorUpdate): Promise<Doctor> {
  const url = `${API_BASE}/api/clinics/${clinicId}/doctors/${doctorId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update doctor: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteDoctor(clinicId: string, doctorId: string): Promise<void> {
  const url = `${API_BASE}/api/clinics/${clinicId}/doctors/${doctorId}`;
  const response = await fetch(url, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(`Failed to delete doctor: ${response.statusText}`);
  }
}

// =============================================================================
// APPOINTMENT ENDPOINTS
// =============================================================================

export async function fetchAppointments(
  clinicId: string,
  options?: { date?: string; doctor_id?: string; status?: string }
): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (options?.date) params.set('date', options.date);
  if (options?.doctor_id) params.set('doctor_id', options.doctor_id);
  if (options?.status) params.set('status', options.status);

  const url = `${API_BASE}/api/clinics/${clinicId}/appointments?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch appointments: ${response.statusText}`);
  }

  const data = await response.json();
  return data.appointments;
}

export async function createAppointment(clinicId: string, data: AppointmentCreate): Promise<Appointment> {
  const url = `${API_BASE}/api/clinics/${clinicId}/appointments`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create appointment: ${response.statusText}`);
  }

  return response.json();
}
