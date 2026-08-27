'use client';

import React, { useState } from 'react';
import { DiscountRule, DiscountType, FuelType } from '@/lib/types/fuel';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="bg-white dark:bg-[#080a0f] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-[2.5rem] w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl transition-colors">
        {/* Header */}
        <div className="border-b border-black/5 dark:border-white/5 p-6 flex items-center justify-between bg-slate-50/50 dark:bg-black/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00D97E] via-[#0075FF] to-[#8000FF] p-0.5 flex items-center justify-center shadow-lg shadow-[#00D97E]/15">
              <div className="w-full h-full bg-white dark:bg-black rounded-[14px] flex items-center justify-center">
                <Ticket className="w-5 h-5 text-[#00D97E]" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Cupones & Tarjetas de Fidelización
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Combina cupones Waylet, Cepsa Gow, BPme o tarjetas de flota
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs (Waylet aesthetic: Saldo, Cupones, Retos, Planes) */}
        <div className="flex items-center border-b border-black/5 dark:border-white/10 px-6 bg-slate-50/30 dark:bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-3.5 px-4 font-bold text-xs transition-all relative flex items-center gap-2 ${
              activeTab === 'coupons'
                ? 'text-[#00A860] dark:text-[#00D97E] border-b-2 border-[#00D97E] font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Cupones Activos ({couponRules.filter((d) => d.active).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`py-3.5 px-4 font-bold text-xs transition-all relative flex items-center gap-2 ${
              activeTab === 'cards'
                ? 'text-[#00A860] dark:text-[#00D97E] border-b-2 border-[#00D97E] font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Tarjetas & Clubs ({cardRules.filter((d) => d.active).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`py-3.5 px-4 font-bold text-xs transition-all relative flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'text-[#00A860] dark:text-[#00D97E] border-b-2 border-[#00D97E] font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Planes de Energía ({planRules.filter((d) => d.active).length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-3.5">
            {currentList.map((rule) => {
              const isCoupon = rule.category === 'coupon' || rule.id.includes('coupon');

              return (
                <div
                  key={rule.id}
                  className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
                    rule.active
                      ? 'bg-slate-50 dark:bg-gradient-to-r dark:from-white/[0.04] dark:to-white/[0.01] border-slate-200 dark:border-white/15 shadow-sm dark:shadow-xl'
                      : 'bg-slate-100/60 dark:bg-black/40 border-slate-200/50 dark:border-white/5 opacity-50'
                  }`}
                >
                  {/* Waylet Coupon Ticket Notches on left border if coupon */}
                  {isCoupon && (
                    <>
                      <div className="absolute -left-2.5 top-1/2 -mt-2.5 w-5 h-5 rounded-full bg-white dark:bg-[#080a0f] border-r border-slate-200 dark:border-white/15" />
                    </>
                  )}

                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      {/* Visual Icon (Gas Pump style like Waylet screenshot) */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center border text-xs font-black uppercase tracking-wider shrink-0 ${
                          rule.active
                            ? 'bg-white dark:bg-gradient-to-br dark:from-zinc-700 dark:to-zinc-900 border-slate-200 dark:border-zinc-500 text-[#00A860] dark:text-[#00D97E] shadow-sm'
                            : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-600'
                        }`}
                      >
                        <Fuel className="w-5 h-5" />
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                            {rule.name}
                          </span>
                          <span className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                            {rule.brand === 'ALL' ? 'Todas las marcas' : rule.brand}
                          </span>
                          {rule.stackable && (
                            <span className="bg-[#00D97E]/15 text-[#00A860] dark:text-[#00D97E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Acumulable +
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                          {rule.description}
                        </p>

                        {(rule.expiresAt || rule.maxLiters) && (
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 pt-1 font-medium">
                            {rule.maxLiters && <span>Hasta {rule.maxLiters}L</span>}
                            {rule.expiresAt && (
                              <span className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                                <Calendar className="w-3 h-3 text-[#00A860] dark:text-[#00D97E]" />
                                {rule.expiresAt}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Value editor + Toggle Switch */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center bg-white dark:bg-black/80 border border-slate-200 dark:border-white/10 rounded-2xl px-3 py-1.5 text-xs font-bold shadow-sm">
                        <span className="text-[#00A860] dark:text-[#00D97E] mr-1">-</span>
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
                          className="w-12 bg-transparent text-right font-black text-[#00A860] dark:text-[#00D97E] focus:outline-none"
                        />
                        <span className="text-slate-500 dark:text-zinc-400 ml-1 text-[11px]">
                          {rule.discountType === 'PERCENTAGE' ? '%' : '€/L'}
                        </span>
                      </div>

                      {/* Sleek Toggle Switch */}
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                          rule.active ? 'bg-[#00D97E]' : 'bg-slate-300 dark:bg-zinc-800 border border-black/5 dark:border-white/10'
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
                          className="p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
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
              className="p-5 rounded-3xl bg-slate-50 dark:bg-black/80 border border-slate-200 dark:border-white/15 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#00D97E]" /> Añadir Nuevo Cupón o Promoción
                </span>
                <Button
                  variant="outline"
                  onPress={() => setShowAddCustom(false)}
                  className="text-xs text-slate-500 dark:text-zinc-400 h-7 border-slate-200 dark:border-white/10"
                >
                  Cancelar
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                    Título del cupón
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 10cts./l de descuento en carburante"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00D97E] font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                    Marca
                  </label>
                  <select
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00D97E] font-medium"
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
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                    Tipo de beneficio
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as DiscountType)}
                    className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00D97E] font-medium"
                  >
                    <option value="FIXED_PER_LITER" className="bg-white dark:bg-[#0f1117]">Descuento directo (€/Litro)</option>
                    <option value="PERCENTAGE" className="bg-white dark:bg-[#0f1117]">Porcentaje (%)</option>
                    <option value="CASHBACK_PER_LITER" className="bg-white dark:bg-[#0f1117]">Saldo acumulable (€/L)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
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
                    className="w-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00D97E] font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  className="bg-[#00D97E] text-black font-black text-xs rounded-full px-5 h-9 shadow-md"
                >
                  Guardar Cupón
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddCustom(true)}
              className="w-full py-4 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-2 text-xs font-bold transition-all bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03]"
            >
              <Plus className="w-4 h-4 text-[#00A860] dark:text-[#00D97E]" /> Añadir cupón promocional o tarjeta
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-black/5 dark:border-white/5 p-6 bg-slate-50/80 dark:bg-black/40 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
            {discounts.filter((d) => d.active).length} beneficios activos aplicados
          </span>
          <Button
            variant="primary"
            onPress={onClose}
            className="bg-slate-900 text-white dark:bg-white dark:text-black font-black text-xs rounded-full px-6 h-10 shadow-lg hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all"
          >
            Aplicar y Recalcular
          </Button>
        </div>
      </div>
    </div>
  );
}
