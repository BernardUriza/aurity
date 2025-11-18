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

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronRight, ClipboardList, Loader2, Zap, X, Send, RefreshCw, AlertCircle } from 'lucide-react';
import { medicalWorkflowApi, type MedicalOrder } from '@/lib/api/medical-workflow';

interface OrderEntryProps {
  sessionId: string;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

const ORDER_TYPES = {
  medication: {
    label: 'Medicación',
    icon: '💊',
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400'
  },
  lab: {
    label: 'Laboratorio',
    icon: '🔬',
    color: 'cyan',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400'
  },
  imaging: {
    label: 'Imagenología',
    icon: '🔍',
    color: 'purple',
    gradient: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/50',
    text: 'text-purple-400'
  },
  followup: {
    label: 'Seguimiento',
    icon: '📅',
    color: 'amber',
    gradient: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/50',
    text: 'text-amber-400'
  }
};

export function OrderEntry({
  sessionId,
  onNext,
  onPrevious,
  className = ''
}: OrderEntryProps) {
  // State
  const [orders, setOrders] = useState<MedicalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [newOrderType, setNewOrderType] = useState<MedicalOrder['type']>('medication');
  const [newOrderDescription, setNewOrderDescription] = useState('');
  const [newOrderDetails, setNewOrderDetails] = useState('');

  // Chatbot state
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Load orders function (memoized with useCallback)
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await medicalWorkflowApi.getOrders(sessionId);
      setOrders(fetchedOrders);
      setLastRefresh(new Date());
      console.log(`[OrderEntry] Loaded ${fetchedOrders.length} orders`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Check if it's a "task not found" error (orders not initialized yet)
      const isNoDataError = errorMsg.includes('not found') ||
                           errorMsg.includes('404') ||
                           errorMsg.includes('does not exist');

      if (isNoDataError) {
        console.log('[OrderEntry] Orders not initialized yet, will continue polling...');
        // Don't show error - this is expected when SOAP hasn't created orders yet
        setOrders([]);
        setLastRefresh(new Date());
      } else {
        console.error('[OrderEntry] Failed to load orders:', err);
        setError('Error al cargar órdenes médicas');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  // Load orders on mount
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Auto-poll every 3s if no orders (detect auto-generation from SOAP)
  useEffect(() => {
    if (orders.length === 0 && !loading) {
      console.log('[OrderEntry] No orders found, starting auto-poll...');
      const interval = setInterval(() => {
        console.log('[OrderEntry] Auto-polling for new orders...');
        loadOrders();
      }, 3000);

      return () => {
        console.log('[OrderEntry] Stopping auto-poll');
        clearInterval(interval);
      };
    }
  }, [orders.length, loading, loadOrders]);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Add order
  const handleAddOrder = async () => {
    if (!newOrderDescription.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const orderId = await medicalWorkflowApi.createOrder(sessionId, {
        type: newOrderType,
        description: newOrderDescription.trim(),
        details: newOrderDetails.trim() || undefined
      });

      // Add to local state immediately (optimistic update)
      const newOrder: MedicalOrder = {
        id: orderId,
        type: newOrderType,
        description: newOrderDescription.trim(),
        details: newOrderDetails.trim() || undefined,
        source: 'manual',
        created_at: new Date().toISOString()
      };

      setOrders(prev => [...prev, newOrder]);
      setNewOrderDescription('');
      setNewOrderDetails('');
    } catch (err) {
      console.error('[OrderEntry] Failed to create order:', err);
      setError('Error al crear la orden');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove order
  const handleRemoveOrder = async (id: string) => {
    try {
      setError(null);

      // Optimistically remove from UI
      setOrders(prev => prev.filter(order => order.id !== id));

      // Call API to delete
      await medicalWorkflowApi.deleteOrder(sessionId, id);
    } catch (err) {
      console.error('[OrderEntry] Failed to delete order:', err);
      setError('Error al eliminar la orden');

      // Reload orders to revert optimistic update
      const fetchedOrders = await medicalWorkflowApi.getOrders(sessionId);
      setOrders(fetchedOrders);
    }
  };

  // Chatbot handler
  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Call assistant API (use empty SOAP structure for orders-only mode)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/workflows/aurity/sessions/${sessionId}/assistant`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: userMessage,
            current_soap: {
              diagnosticTests: [],
              medications: [],
              pastMedicalHistory: [],
              allergies: [],
              hpi: '',
              physicalExam: '',
              primaryDiagnosis: null,
              differentialDiagnoses: [],
              followUp: ''
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      // Create orders from LLM updates
      if (result.updates.diagnosticTests) {
        const operation = result.updates.diagnosticTests;
        const colonIndex = operation.indexOf(':');
        const op = operation.substring(0, colonIndex);
        const content = operation.substring(colonIndex + 1);

        let tests: string[] = [];
        if (op === 'add_items') {
          tests = JSON.parse(content);
        } else if (op === 'add_item') {
          tests = [content];
        }

        // Create lab/imaging orders
        for (const test of tests) {
          const orderType = test.toLowerCase().includes('radiografía') ||
                           test.toLowerCase().includes('tomografía') ||
                           test.toLowerCase().includes('resonancia')
                           ? 'imaging' : 'lab';

          const orderId = await medicalWorkflowApi.createOrder(sessionId, {
            type: orderType,
            description: test,
          });

          setOrders(prev => [...prev, {
            id: orderId,
            type: orderType,
            description: test,
            source: 'manual',
            created_at: new Date().toISOString()
          }]);
        }
      }

      // Create medication orders
      if (result.updates.medications) {
        const operation = result.updates.medications;
        const colonIndex = operation.indexOf(':');
        const op = operation.substring(0, colonIndex);
        const content = operation.substring(colonIndex + 1);

        let meds: any[] = [];
        if (op === 'add_items') {
          meds = JSON.parse(content);
        } else if (op === 'add_item') {
          meds = [JSON.parse(content)];
        }

        for (const med of meds) {
          const description = `${med.name} ${med.dosage} ${med.frequency}`;
          const orderId = await medicalWorkflowApi.createOrder(sessionId, {
            type: 'medication',
            description,
          });

          setOrders(prev => [...prev, {
            id: orderId,
            type: 'medication',
            description,
            source: 'manual',
            created_at: new Date().toISOString()
          }]);
        }
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: result.explanation
      }]);
    } catch (error) {
      console.error('[Chatbot] Error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Group orders by type
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.type]) acc[order.type] = [];
    acc[order.type].push(order);
    return acc;
  }, {} as Record<string, MedicalOrder[]>);

  return (
    <div className={`space-y-8 ${className} max-w-5xl mx-auto`}>
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl mb-4 backdrop-blur-sm border border-emerald-500/20">
          <ClipboardList className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="flex items-center justify-center gap-4">
          <h2 className="text-3xl font-bold text-white tracking-tight">Órdenes Médicas</h2>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refrescar órdenes"
          >
            <RefreshCw className={`h-5 w-5 text-slate-400 hover:text-emerald-400 transition-colors ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* AI Assistant button */}
          <button
            onClick={() => setShowChatbot(!showChatbot)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showChatbot ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'
            } text-white transition-all`}
          >
            <Zap className="h-4 w-4" />
            Asistente IA
          </button>
        </div>

        {/* Last refresh timestamp */}
        {lastRefresh && !loading && (
          <p className="text-xs text-slate-500">
            Última actualización: {lastRefresh.toLocaleTimeString()}
            {orders.length === 0 && <span className="ml-2 text-emerald-400">• Auto-actualizando...</span>}
          </p>
        )}
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Gestiona prescripciones, estudios de laboratorio e imagenología de forma segura
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-xl p-5 flex items-start gap-3 animate-shake">
          <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 font-semibold mb-1">Error al cargar órdenes</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
          <span className="text-slate-300 text-lg font-medium">Cargando órdenes médicas...</span>
          <span className="text-slate-500 text-sm mt-2">Sesión: {sessionId.slice(0, 20)}...</span>
        </div>
      )}

      {/* Quick Stats - Shown when orders exist */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {(Object.keys(ORDER_TYPES) as Array<keyof typeof ORDER_TYPES>).map(type => {
            const count = orders.filter(o => o.type === type).length;
            const typeConfig = ORDER_TYPES[type];
            return (
              <div
                key={type}
                className={`bg-gradient-to-br ${typeConfig.gradient} backdrop-blur-sm rounded-xl p-4 border ${typeConfig.border} transition-all hover:scale-105`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{typeConfig.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">{typeConfig.label}</p>
                    <p className={`text-2xl font-bold ${typeConfig.text}`}>{count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
      <>

      {/* Add New Order */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Plus className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Nueva Orden Médica</h3>
        </div>

        <div className="space-y-6">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Tipo de orden
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(ORDER_TYPES) as Array<keyof typeof ORDER_TYPES>).map(type => {
                const isSelected = newOrderType === type;
                const typeConfig = ORDER_TYPES[type];
                return (
                  <button
                    key={type}
                    onClick={() => setNewOrderType(type)}
                    className={`
                      group relative p-4 rounded-xl border-2 transition-all duration-200
                      ${isSelected
                        ? `bg-gradient-to-br ${typeConfig.gradient} ${typeConfig.border} scale-105 shadow-lg`
                        : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600 hover:scale-102'
                      }
                    `}
                  >
                    <div className="text-3xl mb-2 transform group-hover:scale-110 transition-transform">
                      {typeConfig.icon}
                    </div>
                    <div className={`text-sm font-medium ${isSelected ? typeConfig.text : 'text-slate-300'}`}>
                      {typeConfig.label}
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={newOrderDescription}
              onChange={(e) => setNewOrderDescription(e.target.value)}
              placeholder={
                newOrderType === 'medication' ? 'Ej: Paracetamol 500mg, cada 8 horas' :
                newOrderType === 'lab' ? 'Ej: Biometría hemática completa' :
                newOrderType === 'imaging' ? 'Ej: Radiografía de tórax PA y lateral' :
                'Ej: Control en 7 días'
              }
              className="w-full bg-slate-900/80 text-white px-4 py-3 rounded-xl border-2 border-slate-700/50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Detalles adicionales <span className="text-slate-500 text-xs">(opcional)</span>
            </label>
            <textarea
              value={newOrderDetails}
              onChange={(e) => setNewOrderDetails(e.target.value)}
              placeholder="Instrucciones especiales, horarios, precauciones..."
              rows={3}
              className="w-full bg-slate-900/80 text-white px-4 py-3 rounded-xl border-2 border-slate-700/50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddOrder}
            disabled={!newOrderDescription.trim() || submitting}
            className={`
              w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-lg
              ${newOrderDescription.trim() && !submitting
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transform hover:scale-102 hover:shadow-emerald-500/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              }
            `}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Guardando orden...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Agregar Orden Médica
              </>
            )}
          </button>
        </div>
      </div>

      {/* Orders List */}
      {Object.keys(groupedOrders).length > 0 ? (
        <div className="space-y-5">
          {(Object.keys(ORDER_TYPES) as Array<keyof typeof ORDER_TYPES>).map(type => {
            if (!groupedOrders[type]) return null;
            const typeConfig = ORDER_TYPES[type];

            return (
              <div
                key={type}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className={`p-2 bg-gradient-to-br ${typeConfig.gradient} rounded-lg`}>
                    <span className="text-2xl">{typeConfig.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {typeConfig.label}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {groupedOrders[type].length} {groupedOrders[type].length === 1 ? 'orden' : 'órdenes'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {groupedOrders[type].map((order, index) => (
                    <div
                      key={order.id}
                      className="group flex items-start justify-between p-4 bg-slate-900/80 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start gap-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${typeConfig.text} bg-slate-800/80`}>
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-white font-medium leading-relaxed">{order.description}</p>
                            {order.details && (
                              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{order.details}</p>
                            )}
                            {order.source === 'soap' && (
                              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-md">
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                                Generada automáticamente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveOrder(order.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all ml-4"
                        title="Eliminar orden"
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
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-2xl p-12 border border-dashed border-slate-700/50 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/50 rounded-2xl mb-4">
            <ClipboardList className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-lg">No hay órdenes médicas aún</p>
          <p className="text-slate-500 text-sm mt-2">Agrega tu primera orden usando el formulario arriba</p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <ClipboardList className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total de órdenes</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Sesión</p>
            <p className="text-xs text-slate-500 font-mono">{sessionId.slice(0, 12)}...</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 pt-4">
        {onPrevious && (
          <button
            onClick={onPrevious}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
          >
            Anterior
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/50 flex items-center justify-center gap-2 transform hover:scale-102"
          >
            Continuar al Resumen
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
      </>
      )}

      {/* Chatbot: Asistente IA */}
      {showChatbot && (
        <div className="fixed bottom-6 right-6 w-96 bg-slate-900 rounded-xl border border-emerald-500 shadow-2xl z-50 flex flex-col h-[600px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 p-4 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-white" />
              <h3 className="text-white font-bold">Asistente IA - Órdenes</h3>
            </div>
            <button
              onClick={() => setShowChatbot(false)}
              className="text-white hover:bg-white/20 p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-800">
            {chatMessages.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                <Zap className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                <p className="text-sm">Escribe comandos como:</p>
                <p className="text-xs mt-2 text-emerald-400">"solicita biometría hemática completa"</p>
                <p className="text-xs text-emerald-400">"receta losartán 50mg c/12h"</p>
                <p className="text-xs text-emerald-400">"agrega radiografía de tórax PA"</p>
              </div>
            )}

            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 px-4 py-2 rounded-lg">
                  <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700 bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Escribe un comando..."
                className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none"
                disabled={chatLoading}
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || chatLoading}
                className={`p-2 rounded-lg ${
                  chatInput.trim() && !chatLoading
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <Send className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
