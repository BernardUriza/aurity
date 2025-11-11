'use client';

/**
 * OrderEntry Component - AURITY Medical Workflow
 *
 * Medical orders and prescriptions management.
 * Tracks medications, lab tests, imaging, and follow-up appointments.
 *
 * Features:
 * - Add/edit/remove medical orders
 * - Categorize orders by type
 * - Validate order completeness
 *
 * File: apps/aurity/components/medical/OrderEntry.tsx
 */

import React, { useState } from 'react';
import { Plus, Trash2, ChevronRight, ClipboardList } from 'lucide-react';

interface OrderEntryProps {
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

interface MedicalOrder {
  id: string;
  type: 'medication' | 'lab' | 'imaging' | 'followup';
  description: string;
  details?: string;
}

const ORDER_TYPES = {
  medication: { label: 'Medicación', icon: '💊', color: 'emerald' },
  lab: { label: 'Laboratorio', icon: '🔬', color: 'cyan' },
  imaging: { label: 'Imagenología', icon: '🔍', color: 'purple' },
  followup: { label: 'Seguimiento', icon: '📅', color: 'amber' }
};

export function OrderEntry({
  onNext,
  onPrevious,
  className = ''
}: OrderEntryProps) {
  // State
  const [orders, setOrders] = useState<MedicalOrder[]>([
    {
      id: '1',
      type: 'medication',
      description: 'Paracetamol 500mg',
      details: 'Cada 8 horas por 5 días'
    },
    {
      id: '2',
      type: 'lab',
      description: 'Biometría hemática completa',
      details: 'En ayunas'
    },
    {
      id: '3',
      type: 'followup',
      description: 'Control en 7 días',
      details: 'Traer resultados de laboratorio'
    }
  ]);

  const [newOrderType, setNewOrderType] = useState<MedicalOrder['type']>('medication');
  const [newOrderDescription, setNewOrderDescription] = useState('');
  const [newOrderDetails, setNewOrderDetails] = useState('');

  // Add order
  const handleAddOrder = () => {
    if (!newOrderDescription.trim()) return;

    const newOrder: MedicalOrder = {
      id: Date.now().toString(),
      type: newOrderType,
      description: newOrderDescription.trim(),
      details: newOrderDetails.trim() || undefined
    };

    setOrders(prev => [...prev, newOrder]);
    setNewOrderDescription('');
    setNewOrderDetails('');
  };

  // Remove order
  const handleRemoveOrder = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  // Group orders by type
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.type]) acc[order.type] = [];
    acc[order.type].push(order);
    return acc;
  }, {} as Record<string, MedicalOrder[]>);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Órdenes Médicas</h2>
        <p className="text-slate-400">Agrega medicamentos, estudios y seguimientos</p>
      </div>

      {/* Add New Order */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Agregar Orden
        </h3>

        <div className="space-y-4">
          {/* Type Selector */}
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(ORDER_TYPES) as Array<keyof typeof ORDER_TYPES>).map(type => (
              <button
                key={type}
                onClick={() => setNewOrderType(type)}
                className={`
                  p-3 rounded-lg border transition-all text-center
                  ${newOrderType === type
                    ? `bg-${ORDER_TYPES[type].color}-500/20 border-${ORDER_TYPES[type].color}-500`
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }
                `}
              >
                <div className="text-2xl mb-1">{ORDER_TYPES[type].icon}</div>
                <div className="text-xs text-white">{ORDER_TYPES[type].label}</div>
              </button>
            ))}
          </div>

          {/* Description */}
          <input
            type="text"
            value={newOrderDescription}
            onChange={(e) => setNewOrderDescription(e.target.value)}
            placeholder="Descripción de la orden..."
            className="w-full bg-slate-900 text-white p-3 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none"
          />

          {/* Details */}
          <input
            type="text"
            value={newOrderDetails}
            onChange={(e) => setNewOrderDetails(e.target.value)}
            placeholder="Detalles adicionales (opcional)..."
            className="w-full bg-slate-900 text-white p-3 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none"
          />

          {/* Add Button */}
          <button
            onClick={handleAddOrder}
            disabled={!newOrderDescription.trim()}
            className={`
              w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors
              ${newOrderDescription.trim()
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            <Plus className="h-5 w-5" />
            Agregar Orden
          </button>
        </div>
      </div>

      {/* Orders List */}
      {Object.keys(groupedOrders).length > 0 ? (
        <div className="space-y-4">
          {(Object.keys(ORDER_TYPES) as Array<keyof typeof ORDER_TYPES>).map(type => {
            if (!groupedOrders[type]) return null;

            return (
              <div key={type} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">{ORDER_TYPES[type].icon}</span>
                  {ORDER_TYPES[type].label}
                  <span className="text-sm text-slate-400">({groupedOrders[type].length})</span>
                </h3>

                <div className="space-y-2">
                  {groupedOrders[type].map(order => (
                    <div
                      key={order.id}
                      className="flex items-start justify-between p-3 bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{order.description}</p>
                        {order.details && (
                          <p className="text-sm text-slate-400 mt-1">{order.details}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveOrder(order.id)}
                        className="text-red-400 hover:text-red-300 transition-colors ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
          <ClipboardList className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No hay órdenes agregadas aún</p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Total de órdenes</span>
          <span className="text-2xl font-bold text-emerald-400">{orders.length}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        {onPrevious && (
          <button
            onClick={onPrevious}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Anterior
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Continuar
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
