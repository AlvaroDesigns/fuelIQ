'use client';

import React, { useState } from 'react';
import { DiscountRule, DiscountType, FuelType } from '@/lib/types/fuel';
import { DEFAULT_LOYALTY_PROGRAMS } from '@/lib/data/seed-programs';
import { Button, Chip } from '@heroui/react';
import {
  CreditCard,
  Plus,
  Sparkles,
  Check,
  Trash2,
  Tag,
  ShieldCheck,
  X,
  Ticket,
  Zap,
  Calendar,
  Layers,
  Fuel,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  discounts: DiscountRule[];
  onUpdateDiscounts: (updated: DiscountRule[]) => void;
}

export default function DiscountManagerModal({
  isOpen,
  onClose,
  discounts,
  onUpdateDiscounts,
}: Props) {
  const [activeTab, setActiveTab] = useState<'coupons' | 'cards' | 'plans'>('coupons');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customBrand, setCustomBrand] = useState('REPSOL');
  const [customType, setCustomType] = useState<DiscountType>('FIXED_PER_LITER');
  const [customValue, setCustomValue] = useState('0.10');
  const [customCategory, setCustomCategory] = useState<'coupon' | 'card' | 'plan'>('coupon');
  const [customMaxLiters, setCustomMaxLiters] = useState('60');
  const [customExpiry, setCustomExpiry] = useState('Hasta el 15-09-2026');

  if (!isOpen) return null;

  const handleToggleRule = (id: string) => {
    const updated = discounts.map((d) => (d.id === id ? { ...d, active: !d.active } : d));
    onUpdateDiscounts(updated);
  };

  const handleChangeValue = (id: string, newVal: number) => {
    const updated = discounts.map((d) => (d.id === id ? { ...d, value: newVal } : d));
    onUpdateDiscounts(updated);
  };

  const handleSetType = (id: string, newType: DiscountType) => {
    const updated = discounts.map((d) => {
      if (d.id === id) {
        if (d.discountType === newType) return d;
        let nextVal = d.value;
        if (newType === 'PERCENTAGE') {
          if (d.value <= 0.50) {
            nextVal = Math.round(d.value * 100 * 10) / 10;
            if (nextVal <= 0) nextVal = 4;
          }
        } else if (newType === 'FIXED_PER_LITER') {
          if (d.value >= 1.0) {
            nextVal = Math.round((d.value / 100) * 1000) / 1000;
            if (nextVal <= 0) nextVal = 0.04;
          }
        }
        return { ...d, discountType: newType, value: nextVal };
      }
      return d;
    });
    onUpdateDiscounts(updated);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Quieres restablecer las tarjetas y cupones a sus valores predeterminados?')) {
      onUpdateDiscounts(DEFAULT_LOYALTY_PROGRAMS);
    }
  };

  const handleDeleteRule = (id: string) => {
    const updated = discounts.filter((d) => d.id !== id);
    onUpdateDiscounts(updated);
  };

  const handleAddCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customValue);
    if (!customName.trim() || isNaN(val) || val <= 0) return;

    const newRule: DiscountRule = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      brand: customBrand.toUpperCase().trim(),
      category: customCategory,
      description: `Cupón o descuento personalizado para ${customBrand === 'ALL' ? 'todas las marcas' : customBrand}`,
      discountType: customType,
      value: val,
      maxLiters: customMaxLiters ? parseInt(customMaxLiters, 10) : undefined,
      expiresAt: customExpiry.trim() || undefined,
      stackable: customCategory === 'coupon',
      active: true,
      isCustom: true,
    };

    onUpdateDiscounts([...discounts, newRule]);
    setCustomName('');
    setCustomValue('0.10');
    setShowAddCustom(false);
  };

  // Filter items by category
  const couponRules = discounts.filter((d) => d.category === 'coupon' || (!d.category && d.id.includes('coupon')));
  const cardRules = discounts.filter((d) => d.category === 'card' || (!d.category && !d.id.includes('coupon') && !d.id.includes('plan')));
  const planRules = discounts.filter((d) => d.category === 'plan' || (!d.category && d.id.includes('plan')));

  const currentList =
    activeTab === 'coupons' ? couponRules : activeTab === 'cards' ? cardRules : planRules;

  return (
    <div className="fixed inset-0 z-50 w-full h-full bg-[#f6f8fb] dark:bg-[#04060a] flex flex-col overflow-hidden animate-fade-in transition-colors">
      {/* Top Navigation Header (100% full width) */}
      <header className="sticky top-0 z-20 w-full border-b border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-2xl px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm"
              aria-label="Cerrar modal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#00D97E]" />
                Cupones & Tarjetas de Fidelización
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium hidden sm:block">
                Activa tus ventajas de Repsol Waylet, Cepsa Gow, BPme o añade tus cupones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              title="Restablecer cupones y tarjetas a valores por defecto"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Category Tabs */}
      <div className="border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0c0f16]/90 backdrop-blur-xl px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-4 px-4 font-bold text-xs sm:text-sm transition-all relative flex items-center gap-2 shrink-0 ${
              activeTab === 'coupons'
                ? 'text-[#00A860] dark:text-[#00D97E] border-b-2 border-[#00D97E] font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Cupones Activos ({couponRules.filter((d) => d.active).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`py-4 px-4 font-bold text-xs sm:text-sm transition-all relative flex items-center gap-2 shrink-0 ${
              activeTab === 'cards'
                ? 'text-[#00A860] dark:text-[#00D97E] border-b-2 border-[#00D97E] font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Tarjetas & Clubs ({cardRules.filter((d) => d.active).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`py-4 px-4 font-bold text-xs sm:text-sm transition-all relative flex items-center gap-2 shrink-0 ${
              activeTab === 'plans'
                ? 'text-[#00A860] dark:text-[#00D97E] border-b-2 border-[#00D97E] font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Planes de Energía ({planRules.filter((d) => d.active).length})</span>
          </button>
        </div>
      </div>

      {/* Main Full-Height Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="space-y-3.5">
            {currentList.map((rule) => {
              const isCoupon = rule.category === 'coupon' || rule.id.includes('coupon');

              return (
                <div
                  key={rule.id}
                  className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
                    rule.active
                      ? 'bg-white dark:bg-[#141923] border-slate-300/80 dark:border-white/20 shadow-md dark:shadow-2xl'
                      : 'bg-slate-100/80 dark:bg-[#0a0d14]/70 border-slate-200 dark:border-white/5 opacity-55'
                  }`}
                >
                  {/* Waylet Coupon Ticket Notches on left border if coupon */}
                  {isCoupon && (
                    <>
                      <div className="absolute -left-2.5 top-1/2 -mt-2.5 w-5 h-5 rounded-full bg-[#f6f8fb] dark:bg-[#04060a] border-r border-slate-300 dark:border-white/20" />
                    </>
                  )}

                  <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 sm:gap-4 flex-1">
                      {/* Visual Icon */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border text-xs font-black uppercase tracking-wider shrink-0 ${
                          rule.active
                            ? 'bg-[#00D97E]/10 dark:bg-black/60 border-[#00D97E]/30 dark:border-white/10 text-[#00A860] dark:text-[#00D97E] shadow-sm'
                            : 'bg-slate-200 dark:bg-black/40 border-slate-300 dark:border-white/5 text-slate-400 dark:text-zinc-600'
                        }`}
                      >
                        <Fuel className="w-5 h-5" />
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm sm:text-base text-slate-950 dark:text-white tracking-tight">
                            {rule.name}
                          </span>
                          <span className="bg-slate-200/80 dark:bg-white/10 border border-slate-300/80 dark:border-white/15 text-slate-800 dark:text-zinc-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                            {rule.brand === 'ALL' ? 'Todas las marcas' : rule.brand}
                          </span>
                          {rule.stackable && (
                            <span className="bg-[#00D97E]/15 text-[#00A860] dark:text-[#00D97E] font-black text-[10px] px-2.5 py-0.5 rounded-full">
                              Acumulable +
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed max-w-2xl">
                          {rule.description}
                        </p>

                        {(rule.expiresAt || rule.maxLiters) && (
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 pt-1 font-medium">
                            {rule.maxLiters && <span>Hasta {rule.maxLiters}L</span>}
                            {rule.expiresAt && (
                              <span className="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
                                <Calendar className="w-3.5 h-3.5 text-[#00A860] dark:text-[#00D97E]" />
                                {rule.expiresAt}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Value editor + Segmented Unit Switcher [ €/L | % ] + Toggle Switch */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center bg-slate-100 dark:bg-black/80 border border-slate-300 dark:border-white/15 rounded-2xl p-1 shadow-sm gap-1">
                        <div className="flex items-center pl-2 pr-1">
                          <span className="text-[#00A860] dark:text-[#00D97E] mr-0.5 font-black text-xs">-</span>
                          <input
                            type="number"
                            step={rule.discountType === 'PERCENTAGE' ? '0.5' : '0.01'}
                            min="0.01"
                            max="100"
                            value={rule.value}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v >= 0) {
                                handleChangeValue(rule.id, v);
                              }
                            }}
                            className="w-12 bg-transparent text-right font-black text-[#00A860] dark:text-[#00D97E] focus:outline-none text-xs"
                          />
                        </div>

                        {/* Segmented [ €/L | % ] selector buttons */}
                        <div className="flex items-center bg-slate-200/90 dark:bg-white/10 p-0.5 rounded-xl border border-black/5 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() => handleSetType(rule.id, 'FIXED_PER_LITER')}
                            title="Aplicar descuento directo en €/Litro"
                            className={`px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                              rule.discountType !== 'PERCENTAGE'
                                ? 'bg-white dark:bg-[#1b2230] text-slate-950 dark:text-white font-black shadow-xs'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-semibold'
                            }`}
                          >
                            €/L
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetType(rule.id, 'PERCENTAGE')}
                            title="Aplicar descuento en Porcentaje (%)"
                            className={`px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                              rule.discountType === 'PERCENTAGE'
                                ? 'bg-[#00D97E] text-slate-950 font-black shadow-xs'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-semibold'
                            }`}
                          >
                            %
                          </button>
                        </div>
                      </div>

                      {/* Sleek Toggle Switch */}
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
                          rule.active ? 'bg-[#00D97E]' : 'bg-slate-300 dark:bg-zinc-800 border border-black/10 dark:border-white/10'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                            rule.active ? 'translate-x-5 bg-black' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {rule.isCustom && (
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2.5 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add custom coupon or card form */}
          {showAddCustom ? (
            <form
              onSubmit={handleAddCustomRule}
              className="p-6 rounded-3xl bg-white dark:bg-[#0c0f16] border border-slate-300 dark:border-white/15 space-y-4 shadow-xl animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#00D97E]" /> Añadir Nuevo Cupón o Promoción
                </span>
                <Button
                  variant="outline"
                  onPress={() => setShowAddCustom(false)}
                  className="text-xs text-slate-500 dark:text-zinc-400 h-8 border-slate-200 dark:border-white/10 rounded-full"
                >
                  Cancelar
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                    Título del cupón
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 10cts./l en carburante Repsol Más"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00D97E] font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                    Marca
                  </label>
                  <select
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00D97E] font-medium"
                  >
                    <option value="REPSOL" className="bg-white dark:bg-[#0f1117]">Repsol (Waylet)</option>
                    <option value="CEPSA" className="bg-white dark:bg-[#0f1117]">Cepsa / Moeve (Gow)</option>
                    <option value="BP" className="bg-white dark:bg-[#0f1117]">BP (BPme)</option>
                    <option value="SHELL" className="bg-white dark:bg-[#0f1117]">Shell (ClubSmart)</option>
                    <option value="GALP" className="bg-white dark:bg-[#0f1117]">Galp (Mundo Galp)</option>
                    <option value="BALLENOIL" className="bg-white dark:bg-[#0f1117]">Ballenoil</option>
                    <option value="PLENOIL" className="bg-white dark:bg-[#0f1117]">Plenoil</option>
                    <option value="CARREFOUR" className="bg-white dark:bg-[#0f1117]">Carrefour</option>
                    <option value="ALL" className="bg-white dark:bg-[#0f1117]">Todas las marcas</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                    Tipo de beneficio
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as DiscountType)}
                    className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00D97E] font-medium"
                  >
                    <option value="FIXED_PER_LITER" className="bg-white dark:bg-[#0f1117]">Descuento directo (€/Litro)</option>
                    <option value="PERCENTAGE" className="bg-white dark:bg-[#0f1117]">Porcentaje (%)</option>
                    <option value="CASHBACK_PER_LITER" className="bg-white dark:bg-[#0f1117]">Saldo acumulable (€/L)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                    Valor ({customType === 'PERCENTAGE' ? '%' : '€/L'})
                  </label>
                  <input
                    type="number"
                    step={customType === 'PERCENTAGE' ? '0.5' : '0.01'}
                    min="0.01"
                    required
                    placeholder="0.10"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00D97E] font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  className="bg-[#00D97E] text-black font-black text-xs rounded-full px-6 h-10 shadow-md"
                >
                  Guardar Cupón
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddCustom(true)}
              className="w-full py-5 px-6 rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all bg-white dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03] shadow-sm"
            >
              <Plus className="w-5 h-5 text-[#00A860] dark:text-[#00D97E]" /> Añadir cupón promocional o tarjeta
            </button>
          )}
        </div>
      </main>

      {/* Sticky Bottom Full-Width Action Bar */}
      <footer className="sticky bottom-0 z-20 w-full border-t border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-2xl px-4 sm:px-8 py-4 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 font-medium">
            <span className="font-black text-slate-950 dark:text-white">
              {discounts.filter((d) => d.active).length} beneficios activos
            </span>{' '}
            aplicados al cálculo
          </div>
          <Button
            variant="primary"
            onPress={onClose}
            className="bg-slate-950 text-white dark:bg-white dark:text-black font-black text-xs sm:text-sm rounded-full px-8 h-12 shadow-2xl hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar y Recalcular</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
