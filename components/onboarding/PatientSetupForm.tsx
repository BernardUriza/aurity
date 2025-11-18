"use client";

/**
 * Patient Setup Form - Phase 5 (FI-ONBOARD-006)
 *
 * Interactive patient creation with real-time HDF5 preview
 */

import { useState } from "react";

export interface PatientFormData {
  nombre: string;
  edad: number | '';
  genero: 'masculino' | 'femenino' | 'otro' | '';
  motivoConsulta?: string;
}

interface PatientSetupFormProps {
  onDataChange: (data: PatientFormData) => void;
  onSkipDemo: () => void;
}

export function PatientSetupForm({ onDataChange, onSkipDemo }: PatientSetupFormProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    nombre: '',
    edad: '',
    genero: '',
    motivoConsulta: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PatientFormData, boolean>>>({});

  /**
   * Validate form field
   */
  const validateField = (name: keyof PatientFormData, value: string | number): string | null => {
    switch (name) {
      case 'nombre':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          return 'Nombre es requerido';
        }
        if (typeof value === 'string' && value.length < 2) {
          return 'Nombre debe tener al menos 2 caracteres';
        }
        return null;

      case 'edad':
        if (value === '' || value === null) {
          return 'Edad es requerida';
        }
        const edad = Number(value);
        if (isNaN(edad) || edad < 0 || edad > 120) {
          return 'Edad debe estar entre 0 y 120';
        }
        return null;

      case 'genero':
        if (!value || value === '') {
          return 'Género es requerido';
        }
        return null;

      default:
        return null;
    }
  };

  /**
   * Handle field change
   */
  const handleChange = (name: keyof PatientFormData, value: string | number) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);

    // Validate and update errors
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || undefined }));

    // Notify parent
    onDataChange(newData);
  };

  /**
   * Handle blur (mark field as touched)
   */
  const handleBlur = (name: keyof PatientFormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  /**
   * Check if form is valid
   */
  const isFormValid = () => {
    return (
      formData.nombre.trim().length >= 2 &&
      formData.edad !== '' &&
      Number(formData.edad) >= 0 &&
      Number(formData.edad) <= 120 &&
      formData.genero !== ''
    );
  };

  return (
    <div className="space-y-6">
      {/* Form Title */}
      <div className="p-4 bg-emerald-950/20 border border-emerald-700/30 rounded-xl">
        <p className="text-sm text-emerald-300">
          👤 <strong>Paciente Demo:</strong> Estos datos se guardarán localmente (LocalStorage) solo para esta demo.
          No se envían a ningún servidor.
        </p>
      </div>

      {/* Nombre */}
      <div className="space-y-2">
        <label htmlFor="nombre" className="block text-sm font-semibold text-slate-200">
          Nombre completo <span className="text-red-400">*</span>
        </label>
        <input
          id="nombre"
          type="text"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          onBlur={() => handleBlur('nombre')}
          placeholder="Ej: Juan Pérez García"
          className={`w-full px-4 py-3 bg-slate-900/60 border-2 rounded-xl text-slate-200 placeholder-slate-500 transition-all ${
            touched.nombre && errors.nombre
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-slate-700/50 focus:border-emerald-500'
          } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
        />
        {touched.nombre && errors.nombre && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span>⚠️</span>
            {errors.nombre}
          </p>
        )}
        {formData.nombre.length > 0 && !errors.nombre && (
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <span>✅</span>
            Nombre válido
          </p>
        )}
      </div>

      {/* Edad */}
      <div className="space-y-2">
        <label htmlFor="edad" className="block text-sm font-semibold text-slate-200">
          Edad (años) <span className="text-red-400">*</span>
        </label>
        <input
          id="edad"
          type="number"
          min="0"
          max="120"
          value={formData.edad}
          onChange={(e) => handleChange('edad', e.target.value === '' ? '' : Number(e.target.value))}
          onBlur={() => handleBlur('edad')}
          placeholder="Ej: 35"
          className={`w-full px-4 py-3 bg-slate-900/60 border-2 rounded-xl text-slate-200 placeholder-slate-500 transition-all ${
            touched.edad && errors.edad
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-slate-700/50 focus:border-emerald-500'
          } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
        />
        {touched.edad && errors.edad && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span>⚠️</span>
            {errors.edad}
          </p>
        )}
        {formData.edad !== '' && !errors.edad && (
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <span>✅</span>
            Edad válida
          </p>
        )}
      </div>

      {/* Género */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-200">
          Género <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'masculino', label: 'Masculino', icon: '👨' },
            { value: 'femenino', label: 'Femenino', icon: '👩' },
            { value: 'otro', label: 'Otro', icon: '🧑' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange('genero', option.value)}
              className={`p-3 rounded-xl border-2 transition-all ${
                formData.genero === option.value
                  ? 'border-emerald-500 bg-emerald-950/30 shadow-lg'
                  : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600'
              }`}
            >
              <div className="text-2xl mb-1">{option.icon}</div>
              <div className="text-xs font-medium text-slate-200">{option.label}</div>
            </button>
          ))}
        </div>
        {touched.genero && errors.genero && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span>⚠️</span>
            {errors.genero}
          </p>
        )}
      </div>

      {/* Motivo de Consulta (Optional) */}
      <div className="space-y-2">
        <label htmlFor="motivoConsulta" className="block text-sm font-semibold text-slate-200">
          Motivo de consulta <span className="text-slate-500 text-xs">(opcional)</span>
        </label>
        <textarea
          id="motivoConsulta"
          value={formData.motivoConsulta}
          onChange={(e) => handleChange('motivoConsulta', e.target.value)}
          placeholder="Ej: Dolor de cabeza recurrente, mareos ocasionales"
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/60 border-2 border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <p className="text-xs text-slate-400">
          {formData.motivoConsulta?.length || 0} / 500 caracteres
        </p>
      </div>

      {/* Form Validation Status */}
      <div className={`p-4 rounded-xl border-2 transition-all ${
        isFormValid()
          ? 'border-emerald-500/50 bg-emerald-950/20'
          : 'border-yellow-600/50 bg-yellow-950/20'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isFormValid() ? '✅' : '⏳'}</span>
          <div>
            <p className={`text-sm font-semibold ${isFormValid() ? 'text-emerald-300' : 'text-yellow-300'}`}>
              {isFormValid() ? 'Formulario completo' : 'Completa los campos requeridos'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isFormValid()
                ? 'Todos los datos son válidos. Revisa el preview HDF5 a la derecha.'
                : 'Nombre, edad y género son requeridos para continuar.'}
            </p>
          </div>
        </div>
      </div>

      {/* Skip with Demo Patient */}
      <div className="text-center pt-4 border-t border-slate-700/50">
        <button
          onClick={onSkipDemo}
          className="text-sm text-slate-400 hover:text-emerald-400 underline transition-colors duration-200"
        >
          Saltar con paciente demo precargado →
        </button>
      </div>
    </div>
  );
}
