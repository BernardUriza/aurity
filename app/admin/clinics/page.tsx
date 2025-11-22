/**
 * Clinics Admin Page
 *
 * Admin panel for managing clinics, doctors, and appointments.
 * Route: /admin/clinics
 *
 * Card: FI-CHECKIN-002
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  QrCode,
  CreditCard,
  MessageSquare,
  Pencil,
  Trash2,
  ChevronRight,
  X,
} from 'lucide-react';
import type { Clinic, ClinicCreate, Doctor, Appointment } from '@/lib/api/clinics';
import {
  fetchClinics,
  createClinic,
  updateClinic,
  deleteClinic,
  fetchDoctors,
  fetchAppointments,
} from '@/lib/api/clinics';

export default function ClinicsAdminPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load clinics on mount
  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchClinics(false); // Include inactive
      setClinics(data);
    } catch (err) {
      console.error('Failed to load clinics:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las clínicas');
    } finally {
      setLoading(false);
    }
  };

  const loadClinicDetails = async (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setLoadingDetails(true);
    try {
      const [doctorsData, appointmentsData] = await Promise.all([
        fetchDoctors(clinic.clinic_id, false),
        fetchAppointments(clinic.clinic_id),
      ]);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
    } catch (err) {
      console.error('Failed to load clinic details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateClinic = async (data: ClinicCreate) => {
    try {
      const newClinic = await createClinic(data);
      setClinics((prev) => [...prev, newClinic]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create clinic:', err);
      throw err;
    }
  };

  const handleDeleteClinic = async (clinicId: string) => {
    if (!confirm('¿Estás seguro de desactivar esta clínica?')) return;
    try {
      await deleteClinic(clinicId);
      setClinics((prev) =>
        prev.map((c) => (c.clinic_id === clinicId ? { ...c, is_active: false } : c))
      );
      if (selectedClinic?.clinic_id === clinicId) {
        setSelectedClinic(null);
      }
    } catch (err) {
      console.error('Failed to delete clinic:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-400" />
              Gestión de Clínicas
            </h1>
            <p className="text-slate-400 mt-2">
              Administra clínicas, doctores y citas del sistema de check-in
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Clínica
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clinics List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Clínicas</h2>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-4 bg-red-950/20 border border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
                <button
                  onClick={loadClinics}
                  className="mt-2 text-sm text-red-400 hover:text-red-300"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Clinics List */}
            {!loading && !error && clinics.map((clinic) => (
              <div
                key={clinic.clinic_id}
                onClick={() => loadClinicDetails(clinic)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedClinic?.clinic_id === clinic.clinic_id
                    ? 'bg-indigo-950/50 border-indigo-500'
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                } ${!clinic.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{clinic.name}</h3>
                    <p className="text-sm text-slate-400">{clinic.specialty}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {clinic.checkin_qr_enabled && (
                        <QrCode className="w-4 h-4 text-green-400" title="QR Check-in" />
                      )}
                      {clinic.payments_enabled && (
                        <CreditCard className="w-4 h-4 text-yellow-400" title="Pagos" />
                      )}
                      {clinic.chat_enabled && (
                        <MessageSquare className="w-4 h-4 text-blue-400" title="Chat" />
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
                {!clinic.is_active && (
                  <span className="text-xs text-red-400 mt-2 block">Inactiva</span>
                )}
              </div>
            ))}

            {!loading && !error && clinics.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No hay clínicas registradas
              </div>
            )}
          </div>

          {/* Clinic Details Panel */}
          <div className="lg:col-span-2">
            {selectedClinic ? (
              <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-6">
                {/* Clinic Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedClinic.name}</h2>
                    <p className="text-slate-400">{selectedClinic.specialty}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Plan: {selectedClinic.subscription_plan}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteClinic(selectedClinic.clinic_id)}
                      className="p-2 text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
                      title="Desactivar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Clinic Info */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <span className="text-sm text-slate-500">Zona horaria</span>
                    <p className="text-white">{selectedClinic.timezone}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Color primario</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: selectedClinic.primary_color || '#6366f1' }}
                      />
                      <span className="text-white">{selectedClinic.primary_color}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-slate-500">Mensaje de bienvenida</span>
                    <p className="text-white">{selectedClinic.welcome_message || '-'}</p>
                  </div>
                </div>

                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Doctors Section */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-indigo-400" />
                          Doctores ({doctors.length})
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {doctors.map((doctor) => (
                          <div
                            key={doctor.doctor_id}
                            className={`p-3 bg-slate-800/50 rounded-lg flex items-center justify-between ${
                              !doctor.is_active ? 'opacity-50' : ''
                            }`}
                          >
                            <div>
                              <p className="text-white font-medium">{doctor.display_name}</p>
                              <p className="text-sm text-slate-400">
                                {doctor.especialidad} • {doctor.avg_consultation_minutes} min/consulta
                              </p>
                            </div>
                            {doctor.cedula_profesional && (
                              <span className="text-xs text-slate-500">
                                Cédula: {doctor.cedula_profesional}
                              </span>
                            )}
                          </div>
                        ))}
                        {doctors.length === 0 && (
                          <p className="text-slate-500 text-sm">No hay doctores registrados</p>
                        )}
                      </div>
                    </div>

                    {/* Appointments Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-indigo-400" />
                          Citas ({appointments.length})
                        </h3>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {appointments.map((apt) => (
                          <div
                            key={apt.appointment_id}
                            className="p-3 bg-slate-800/50 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white text-sm">
                                  {new Date(apt.scheduled_at).toLocaleString('es-MX')}
                                </p>
                                <p className="text-slate-400 text-xs">{apt.reason || apt.appointment_type}</p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <QrCode className="w-4 h-4 text-green-400" />
                                  <span className="font-mono text-lg text-green-400">
                                    {apt.checkin_code}
                                  </span>
                                </div>
                                <span className={`text-xs ${
                                  apt.status === 'scheduled' ? 'text-yellow-400' :
                                  apt.status === 'confirmed' ? 'text-blue-400' :
                                  apt.status === 'checked_in' ? 'text-green-400' :
                                  'text-slate-400'
                                }`}>
                                  {apt.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {appointments.length === 0 && (
                          <p className="text-slate-500 text-sm">No hay citas registradas</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-24 text-slate-500">
                <Building2 className="w-16 h-16 mb-4 opacity-50" />
                <p>Selecciona una clínica para ver sus detalles</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Clinic Modal */}
        {showCreateModal && (
          <CreateClinicModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateClinic}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CREATE CLINIC MODAL
// =============================================================================

function CreateClinicModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: ClinicCreate) => Promise<void>;
}) {
  const [formData, setFormData] = useState<ClinicCreate>({
    name: '',
    specialty: 'general',
    welcome_message: '',
    payments_enabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onCreate(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la clínica');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Nueva Clínica</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Nombre de la clínica"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Especialidad</label>
            <select
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="general">General</option>
              <option value="pediatria">Pediatría</option>
              <option value="cardiologia">Cardiología</option>
              <option value="dermatologia">Dermatología</option>
              <option value="ginecologia">Ginecología</option>
              <option value="oftalmologia">Oftalmología</option>
              <option value="traumatologia">Traumatología</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Mensaje de bienvenida</label>
            <textarea
              value={formData.welcome_message}
              onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              rows={2}
              placeholder="¡Bienvenido a nuestra clínica!"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="payments"
              checked={formData.payments_enabled}
              onChange={(e) => setFormData({ ...formData, payments_enabled: e.target.checked })}
              className="w-4 h-4 text-indigo-500"
            />
            <label htmlFor="payments" className="text-sm text-slate-400">
              Habilitar pagos (Stripe)
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-800 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear Clínica
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
