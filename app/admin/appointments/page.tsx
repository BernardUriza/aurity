"use client";

/**
 * Appointments Calendar Page
 * Card: FI-CHECKIN-005
 *
 * Medical appointments scheduler using Bryntum Scheduler Pro.
 * Shows doctors as resources (rows) and appointments as events.
 * Supports multiple views: Day, Week, Month
 */

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw, CalendarDays, CalendarRange, LayoutGrid } from "lucide-react";

// View preset configurations
type ViewMode = "day" | "week" | "month";

interface ViewPresetConfig {
  id: string;
  label: string;
  icon: typeof CalendarDays;
  preset: object;
  getDateRange: (date: Date) => { start: Date; end: Date };
  navigationUnit: "day" | "week" | "month";
  dateFormat: Intl.DateTimeFormatOptions;
}

const VIEW_PRESETS: Record<ViewMode, ViewPresetConfig> = {
  day: {
    id: "day",
    label: "Día",
    icon: CalendarDays,
    preset: {
      base: "hourAndDay",
      tickWidth: 80,
      headers: [
        { unit: "day", dateFormat: "dddd, D MMMM YYYY" },
        { unit: "hour", dateFormat: "HH:mm" },
      ],
    },
    getDateRange: (date: Date) => {
      const start = new Date(date);
      start.setHours(8, 0, 0, 0);
      const end = new Date(date);
      end.setHours(20, 0, 0, 0);
      return { start, end };
    },
    navigationUnit: "day",
    dateFormat: { weekday: "long", day: "numeric", month: "long" },
  },
  week: {
    id: "week",
    label: "Semana",
    icon: CalendarRange,
    preset: {
      base: "weekAndDay",
      tickWidth: 100,
      headers: [
        { unit: "week", dateFormat: "Semana W, MMMM YYYY" },
        { unit: "day", dateFormat: "ddd D" },
      ],
    },
    getDateRange: (date: Date) => {
      const start = new Date(date);
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
    navigationUnit: "week",
    dateFormat: { day: "numeric", month: "short" },
  },
  month: {
    id: "month",
    label: "Mes",
    icon: LayoutGrid,
    preset: {
      base: "monthAndYear",
      tickWidth: 50,
      headers: [
        { unit: "month", dateFormat: "MMMM YYYY" },
        { unit: "day", dateFormat: "D" },
      ],
    },
    getDateRange: (date: Date) => {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    },
    navigationUnit: "month",
    dateFormat: { month: "long", year: "numeric" },
  },
};

// Types
interface Doctor {
  doctor_id: string;
  nombre: string;
  apellido: string;
  display_name: string | null;
  especialidad: string | null;
  avg_consultation_minutes: number;
}

interface Appointment {
  appointment_id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  estimated_duration: number;
  appointment_type: string;
  status: string;
  checkin_code: string;
  reason: string | null;
}

interface Clinic {
  clinic_id: string;
  name: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:7001";

export default function AppointmentsCalendarPage() {
  const schedulerRef = useRef<HTMLDivElement>(null);
  const schedulerInstanceRef = useRef<unknown>(null);

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [schedulerReady, setSchedulerReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  // Fetch clinics on mount
  useEffect(() => {
    fetchClinics();
  }, []);

  // Fetch doctors and appointments when clinic changes
  useEffect(() => {
    if (selectedClinic) {
      fetchDoctors(selectedClinic);
      fetchAppointments(selectedClinic, currentDate);
    }
  }, [selectedClinic, currentDate]);

  // Initialize Bryntum Scheduler when data is ready
  useEffect(() => {
    if (schedulerRef.current && doctors.length > 0 && !schedulerInstanceRef.current) {
      initializeScheduler();
    }
  }, [doctors, appointments]);

  // Update scheduler data when appointments change
  useEffect(() => {
    if (schedulerInstanceRef.current && schedulerReady) {
      updateSchedulerData();
    }
  }, [appointments, schedulerReady]);

  async function fetchClinics() {
    try {
      const res = await fetch(`${API_BASE}/api/clinics`);
      const data = await res.json();
      setClinics(data.clinics || []);
      if (data.clinics?.length > 0) {
        setSelectedClinic(data.clinics[0].clinic_id);
      }
    } catch (error) {
      console.error("Failed to fetch clinics:", error);
    }
  }

  async function fetchDoctors(clinicId: string) {
    try {
      const res = await fetch(`${API_BASE}/api/clinics/${clinicId}/doctors`);
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAppointments(clinicId: string, date: Date) {
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch(`${API_BASE}/api/clinics/${clinicId}/appointments?date=${dateStr}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    }
  }

  function initializeScheduler() {
    // Load Bryntum dynamically to avoid SSR issues
    const script = document.createElement("script");
    script.src = "/js/bryntum/schedulerpro.wc.module.js";
    script.type = "module";
    script.onload = () => {
      createScheduler();
    };
    document.head.appendChild(script);

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/bryntum/schedulerpro.classic-light.css";
    document.head.appendChild(link);
  }

  function createScheduler() {
    if (!schedulerRef.current || schedulerInstanceRef.current) return;

    // @ts-expect-error - Bryntum is loaded dynamically
    const { SchedulerPro } = window.bryntum || {};

    if (!SchedulerPro) {
      console.error("Bryntum SchedulerPro not loaded");
      return;
    }

    const viewConfig = VIEW_PRESETS[viewMode];
    const { start, end } = viewConfig.getDateRange(currentDate);

    const scheduler = new SchedulerPro({
      appendTo: schedulerRef.current,
      startDate: start,
      endDate: end,
      viewPreset: viewConfig.preset,
      rowHeight: 60,
      barMargin: 5,

      features: {
        eventDrag: { constrainDragToResource: true },
        eventResize: true,
        eventEdit: {
          items: {
            patientField: {
              type: "text",
              name: "patient_name",
              label: "Paciente",
              weight: 100,
            },
            reasonField: {
              type: "textarea",
              name: "reason",
              label: "Motivo",
              weight: 200,
            },
            typeField: {
              type: "combo",
              name: "appointment_type",
              label: "Tipo",
              items: ["consulta", "seguimiento", "urgencia", "procedimiento"],
              weight: 300,
            },
          },
        },
        eventTooltip: {
          template: ({ eventRecord }: { eventRecord: { data: Record<string, unknown> } }) => `
            <div class="p-2">
              <div class="font-bold">${eventRecord.data.name || "Cita"}</div>
              <div class="text-sm text-gray-600">${eventRecord.data.patient_name || ""}</div>
              <div class="text-xs text-gray-500 mt-1">
                Código: <span class="font-mono">${eventRecord.data.checkin_code || "N/A"}</span>
              </div>
              <div class="text-xs mt-1">
                ${eventRecord.data.reason || "Sin motivo especificado"}
              </div>
            </div>
          `,
        },
      },

      columns: [
        {
          type: "resourceInfo",
          text: "Doctor",
          width: 200,
          showImage: false,
          showEventCount: true,
        },
      ],

      resources: doctors.map((doc) => ({
        id: doc.doctor_id,
        name: doc.display_name || `${doc.nombre} ${doc.apellido}`,
        specialty: doc.especialidad,
        eventColor: getColorForSpecialty(doc.especialidad),
      })),

      events: appointments.map((apt) => ({
        id: apt.appointment_id,
        resourceId: apt.doctor_id,
        startDate: new Date(apt.scheduled_at),
        endDate: new Date(new Date(apt.scheduled_at).getTime() + apt.estimated_duration * 60000),
        name: apt.appointment_type,
        patient_name: apt.patient_id, // TODO: Fetch patient name
        checkin_code: apt.checkin_code,
        reason: apt.reason,
        appointment_type: apt.appointment_type,
        status: apt.status,
        eventColor: getColorForStatus(apt.status),
      })),

      listeners: {
        eventDrop: async ({ eventRecords, context }: { eventRecords: { id: string; startDate: Date; resourceId: string }[]; context: { async: boolean } }) => {
          context.async = true;
          // TODO: Update appointment via API
          console.log("Event dropped:", eventRecords);
        },
        beforeEventEdit: ({ eventRecord }: { eventRecord: { data: { status: string } } }) => {
          if (eventRecord.data.status === "completed") {
            return false; // Prevent editing completed appointments
          }
        },
      },
    });

    schedulerInstanceRef.current = scheduler;
    setSchedulerReady(true);
  }

  function updateSchedulerData() {
    const scheduler = schedulerInstanceRef.current as {
      resourceStore?: { data: unknown[] };
      eventStore?: { data: unknown[] };
    } | null;
    if (!scheduler) return;

    // Update resources (doctors)
    if (scheduler.resourceStore) {
      scheduler.resourceStore.data = doctors.map((doc) => ({
        id: doc.doctor_id,
        name: doc.display_name || `${doc.nombre} ${doc.apellido}`,
        specialty: doc.especialidad,
        eventColor: getColorForSpecialty(doc.especialidad),
      }));
    }

    // Update events (appointments)
    if (scheduler.eventStore) {
      scheduler.eventStore.data = appointments.map((apt) => ({
        id: apt.appointment_id,
        resourceId: apt.doctor_id,
        startDate: new Date(apt.scheduled_at),
        endDate: new Date(new Date(apt.scheduled_at).getTime() + apt.estimated_duration * 60000),
        name: apt.appointment_type,
        checkin_code: apt.checkin_code,
        reason: apt.reason,
        status: apt.status,
        eventColor: getColorForStatus(apt.status),
      }));
    }
  }

  function getColorForSpecialty(specialty: string | null): string {
    const colors: Record<string, string> = {
      "Medicina General": "blue",
      "Pediatría": "green",
      "Cardiología": "red",
      "Dermatología": "purple",
      "Ginecología": "pink",
      "Traumatología": "orange",
    };
    return colors[specialty || ""] || "blue";
  }

  function getColorForStatus(status: string): string {
    const colors: Record<string, string> = {
      scheduled: "blue",
      confirmed: "green",
      checked_in: "teal",
      in_progress: "orange",
      completed: "gray",
      cancelled: "red",
      no_show: "yellow",
    };
    return colors[status] || "blue";
  }

  function navigateDate(direction: "prev" | "next") {
    const newDate = new Date(currentDate);
    const viewConfig = VIEW_PRESETS[viewMode];
    const delta = direction === "next" ? 1 : -1;

    // Navigate based on current view mode
    switch (viewConfig.navigationUnit) {
      case "day":
        newDate.setDate(newDate.getDate() + delta);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + delta * 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + delta);
        break;
    }

    setCurrentDate(newDate);
    updateSchedulerTimeSpan(newDate);
  }

  function updateSchedulerTimeSpan(date: Date) {
    const scheduler = schedulerInstanceRef.current as {
      startDate?: Date;
      endDate?: Date;
      viewPreset?: object;
    } | null;

    if (scheduler) {
      const viewConfig = VIEW_PRESETS[viewMode];
      const { start, end } = viewConfig.getDateRange(date);
      scheduler.startDate = start;
      scheduler.endDate = end;
    }
  }

  function changeViewMode(newMode: ViewMode) {
    setViewMode(newMode);

    const scheduler = schedulerInstanceRef.current as {
      startDate?: Date;
      endDate?: Date;
      viewPreset?: object;
    } | null;

    if (scheduler) {
      const viewConfig = VIEW_PRESETS[newMode];
      const { start, end } = viewConfig.getDateRange(currentDate);
      scheduler.viewPreset = viewConfig.preset;
      scheduler.startDate = start;
      scheduler.endDate = end;
    }
  }

  function goToToday() {
    const today = new Date();
    setCurrentDate(today);
    updateSchedulerTimeSpan(today);
  }

  function getDateDisplayText(): string {
    const viewConfig = VIEW_PRESETS[viewMode];

    if (viewMode === "week") {
      const { start, end } = viewConfig.getDateRange(currentDate);
      const startStr = start.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
      const endStr = end.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
      return `${startStr} - ${endStr}`;
    }

    return currentDate.toLocaleDateString("es-MX", viewConfig.dateFormat);
  }

  if (loading && !selectedClinic) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agenda de Citas</h1>
              <p className="text-sm text-gray-500">
                Gestión de citas médicas con Bryntum Scheduler Pro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Clinic Selector */}
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {clinics.map((clinic) => (
                <option key={clinic.clinic_id} value={clinic.clinic_id}>
                  {clinic.name}
                </option>
              ))}
            </select>

            {/* View Mode Selector */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(Object.keys(VIEW_PRESETS) as ViewMode[]).map((mode) => {
                const config = VIEW_PRESETS[mode];
                const Icon = config.icon;
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => changeViewMode(mode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title={config.label}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => navigateDate("prev")}
                className="p-2 hover:bg-gray-200 rounded"
                title={`${VIEW_PRESETS[viewMode].navigationUnit === "day" ? "Día" : VIEW_PRESETS[viewMode].navigationUnit === "week" ? "Semana" : "Mes"} anterior`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm font-medium hover:bg-gray-200 rounded"
              >
                Hoy
              </button>
              <span className="px-3 py-1 font-medium min-w-[180px] text-center">
                {getDateDisplayText()}
              </span>
              <button
                onClick={() => navigateDate("next")}
                className="p-2 hover:bg-gray-200 rounded"
                title={`${VIEW_PRESETS[viewMode].navigationUnit === "day" ? "Día" : VIEW_PRESETS[viewMode].navigationUnit === "week" ? "Semana" : "Mes"} siguiente`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={() => fetchAppointments(selectedClinic, currentDate)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Actualizar"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                // TODO: Open new appointment modal
                alert("Crear nueva cita - TODO");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Nueva Cita
            </button>
          </div>
        </div>
      </header>

      {/* Status Legend */}
      <div className="bg-white border-b px-6 py-2">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-500">Estado:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Programada</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>Confirmada</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-teal-500" />
            <span>Check-in</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span>En curso</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Completada</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Cancelada</span>
          </div>
        </div>
      </div>

      {/* Scheduler Container */}
      <div className="p-6">
        <div
          ref={schedulerRef}
          className="bg-white rounded-lg shadow-sm border"
          style={{ height: "calc(100vh - 220px)" }}
        />

        {doctors.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No hay doctores configurados
              </h3>
              <p className="text-gray-500 mt-1">
                Agregue doctores en la sección de Clínicas para ver la agenda
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
