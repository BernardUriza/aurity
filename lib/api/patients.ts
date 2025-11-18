/**
 * Patient API Client
 *
 * Type-safe client for PostgreSQL patient management
 * Connects to FastAPI backend (/api/patients)
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

// Backend API types (matching backend/api/public/patients.py schemas)
export interface PatientCreate {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string; // ISO date string "YYYY-MM-DD"
  curp?: string | null;
}

export interface PatientUpdate {
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string;
  curp?: string | null;
}

export interface PatientResponse {
  patient_id: string; // UUID
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  curp: string | null;
  created_at: string;
  updated_at: string | null;
}

// Frontend Patient type (converted from backend)
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  medicalHistory?: string[];
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  // Backend fields
  curp?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Convert backend PatientResponse to frontend Patient type
 */
function toFrontendPatient(p: PatientResponse): Patient {
  const birthDate = new Date(p.fecha_nacimiento);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return {
    id: p.patient_id,
    name: `${p.nombre} ${p.apellido}`,
    age,
    gender: 'Otro', // TODO: Add gender field to backend schema
    curp: p.curp,
    createdAt: p.created_at,
    updatedAt: p.updated_at || undefined,
    medicalHistory: [], // TODO: Implement in future
    allergies: [], // TODO: Implement in future
    chronicConditions: [], // TODO: Implement in future
    currentMedications: [], // TODO: Implement in future
  };
}

/**
 * Fetch all patients with optional search
 */
export async function fetchPatients(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Patient[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());

  const url = `${API_BASE}/api/patients/?${queryParams}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch patients: ${response.statusText}`);
  }

  const data: PatientResponse[] = await response.json();
  return data.map(toFrontendPatient);
}

/**
 * Fetch single patient by ID
 */
export async function fetchPatient(patientId: string): Promise<Patient> {
  const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Patient not found');
    }
    throw new Error(`Failed to fetch patient: ${response.statusText}`);
  }

  const data: PatientResponse = await response.json();
  return toFrontendPatient(data);
}

/**
 * Create new patient
 */
export async function createPatient(patient: PatientCreate): Promise<Patient> {
  const response = await fetch(`${API_BASE}/api/patients/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to create patient: ${response.statusText}`);
  }

  const data: PatientResponse = await response.json();
  return toFrontendPatient(data);
}

/**
 * Update existing patient
 */
export async function updatePatient(patientId: string, updates: PatientUpdate): Promise<Patient> {
  const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to update patient: ${response.statusText}`);
  }

  const data: PatientResponse = await response.json();
  return toFrontendPatient(data);
}

/**
 * Delete patient
 */
export async function deletePatient(patientId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete patient: ${response.statusText}`);
  }
}
