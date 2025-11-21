/**
 * PatientForm Component
 *
 * Reusable form for creating/editing patients
 * Validates CURP format (Mexican national ID)
 *
 * @example
 * <PatientForm
 *   onSubmit={(data) => createPatient(data)}
 *   initialData={existingPatient}
 *   mode="edit"
 * />
 */

import React, { useState } from 'react';
import { User, Calendar, Hash } from 'lucide-react';
import type { PatientCreate } from '@/lib/api/patients';

export interface PatientFormProps {
  /** Callback when form is submitted */
  onSubmit: (data: PatientCreate) => Promise<void> | void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Initial form data (for edit mode) */
  initialData?: Partial<PatientCreate>;
  /** Form mode */
  mode?: 'create' | 'edit';
  /** Loading state */
  loading?: boolean;
}

interface FormErrors {
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string;
  curp?: string;
}

/**
 * Validate Mexican CURP format
 * Format: AAAA######AAAAAA## (18 chars)
 */
function validateCURP(curp: string): boolean {
  if (!curp) return true; // Optional field
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  return curpRegex.test(curp.toUpperCase());
}

export const PatientForm: React.FC<PatientFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  mode = 'create',
  loading = false,
}) => {
  const [formData, setFormData] = useState<PatientCreate>({
    nombre: initialData?.nombre || '',
    apellido: initialData?.apellido || '',
    fecha_nacimiento: initialData?.fecha_nacimiento || '',
    curp: initialData?.curp || null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof PatientCreate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || null,
    }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof PatientCreate) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field] as string);
  };

  const validateField = (field: keyof PatientCreate, value: string): boolean => {
    const newErrors: FormErrors = {};

    switch (field) {
      case 'nombre':
        if (!value || value.trim().length < 2) {
          newErrors.nombre = 'Nombre debe tener al menos 2 caracteres';
        }
        break;
      case 'apellido':
        if (!value || value.trim().length < 2) {
          newErrors.apellido = 'Apellido debe tener al menos 2 caracteres';
        }
        break;
      case 'fecha_nacimiento':
        if (!value) {
          newErrors.fecha_nacimiento = 'Fecha de nacimiento es requerida';
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          const age = (today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          if (age < 0) {
            newErrors.fecha_nacimiento = 'Fecha no puede estar en el futuro';
          } else if (age > 150) {
            newErrors.fecha_nacimiento = 'Fecha no válida';
          }
        }
        break;
      case 'curp':
        if (value && !validateCURP(value)) {
          newErrors.curp = 'CURP inválido (ej: AAAA######AAAAAA##)';
        }
        break;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const fieldsToValidate: (keyof PatientCreate)[] = ['nombre', 'apellido', 'fecha_nacimiento', 'curp'];
    const validations = fieldsToValidate.map(field => validateField(field, formData[field] as string));
    return validations.every(v => v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      nombre: true,
      apellido: true,
      fecha_nacimiento: true,
      curp: true,
    });

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-400" />
            Nombre(s) <span className="text-red-400">*</span>
          </div>
        </label>
        <input
          id="nombre"
          type="text"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          onBlur={() => handleBlur('nombre')}
          disabled={loading}
          placeholder="María"
          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
            touched.nombre && errors.nombre
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-emerald-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {touched.nombre && errors.nombre && (
          <p className="text-red-400 text-sm mt-1">{errors.nombre}</p>
        )}
      </div>

      {/* Apellido */}
      <div>
        <label htmlFor="apellido" className="block text-sm font-medium text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-400" />
            Apellido(s) <span className="text-red-400">*</span>
          </div>
        </label>
        <input
          id="apellido"
          type="text"
          value={formData.apellido}
          onChange={(e) => handleChange('apellido', e.target.value)}
          onBlur={() => handleBlur('apellido')}
          disabled={loading}
          placeholder="García López"
          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
            touched.apellido && errors.apellido
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-emerald-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {touched.apellido && errors.apellido && (
          <p className="text-red-400 text-sm mt-1">{errors.apellido}</p>
        )}
      </div>

      {/* Fecha de Nacimiento */}
      <div>
        <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            Fecha de Nacimiento <span className="text-red-400">*</span>
          </div>
        </label>
        <input
          id="fecha_nacimiento"
          type="date"
          value={formData.fecha_nacimiento}
          onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
          onBlur={() => handleBlur('fecha_nacimiento')}
          disabled={loading}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
            touched.fecha_nacimiento && errors.fecha_nacimiento
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-cyan-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {touched.fecha_nacimiento && errors.fecha_nacimiento && (
          <p className="text-red-400 text-sm mt-1">{errors.fecha_nacimiento}</p>
        )}
      </div>

      {/* CURP (opcional) */}
      <div>
        <label htmlFor="curp" className="block text-sm font-medium text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-purple-400" />
            CURP <span className="text-slate-500 text-xs">(opcional)</span>
          </div>
        </label>
        <input
          id="curp"
          type="text"
          value={formData.curp || ''}
          onChange={(e) => handleChange('curp', e.target.value.toUpperCase())}
          onBlur={() => handleBlur('curp')}
          disabled={loading}
          placeholder="GAML800101HDFRRS09"
          maxLength={18}
          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 transition-all ${
            touched.curp && errors.curp
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-purple-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {touched.curp && errors.curp && (
          <p className="text-red-400 text-sm mt-1">{errors.curp}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          18 caracteres: 4 letras + 6 dígitos + 8 caracteres
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Guardando...</span>
            </div>
          ) : (
            mode === 'create' ? 'Crear Paciente' : 'Guardar Cambios'
          )}
        </button>
      </div>
    </form>
  );
};
