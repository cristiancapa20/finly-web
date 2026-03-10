"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { getCategoryIcon } from "@/lib/categoryIcons";

interface Category { id: string; name: string; color: string }
interface Account  { id: string; name: string }

interface ParsedTransaction {
  amount: number | null;
  type: "INCOME" | "EXPENSE" | null;
  categoryId: string | null;
  accountId: string | null;
  description: string | null;
  date: string | null;
}

interface FormState {
  amount: string;
  type: "INCOME" | "EXPENSE" | "";
  categoryId: string;
  accountId: string;
  description: string;
  date: string;
}

// Mic feature temporarily disabled
// interface SpeechRecognitionAlternative { transcript: string }
// interface SpeechRecognitionResult {
//   readonly length: number;
//   isFinal: boolean;
//   [index: number]: SpeechRecognitionAlternative;
// }
// interface SpeechRecognitionResultList {
//   readonly length: number;
//   [index: number]: SpeechRecognitionResult;
// }
// interface SpeechRecognitionEvent extends Event {
//   resultIndex: number;
//   results: SpeechRecognitionResultList;
// }
// interface SpeechRecognitionInstance extends EventTarget {
//   lang: string;
//   continuous: boolean;
//   interimResults: boolean;
//   onresult: ((event: SpeechRecognitionEvent) => void) | null;
//   onend: (() => void) | null;
//   onerror: (() => void) | null;
//   start(): void;
//   stop(): void;
// }
// declare global {
//   interface Window {
//     SpeechRecognition?: new () => SpeechRecognitionInstance;
//     webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
//   }
// }

function CategoryBadge({ name, color }: { name: string; color: string }) {
  const Icon = getCategoryIcon(name);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: color + "22" }}>
        <Icon className="w-3 h-3" style={{ color }} />
      </span>
      <span className="text-xs text-gray-700">{name}</span>
    </span>
  );
}

export default function QuickTransactionButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen]             = useState(false);
  const [text, setText]                 = useState("");
  const [isParsing, setIsParsing]       = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [form, setForm]                 = useState<FormState | null>(null);
  const [nullFields, setNullFields]     = useState<Set<string>>(new Set());
  const [categories, setCategories]     = useState<Category[]>([]);
  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  // const [micState, setMicState]         = useState<"idle" | "recording">("idle");
  // const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  // const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  /* ── load categories & accounts once ── */
  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]).then(([catRes, accRes]) => {
      if (catRes.data) setCategories(catRes.data);
      if (accRes.data) setAccounts(accRes.data);
      setAccountsLoaded(true);
    });
  }, []);

  // useEffect(() => {
  //   setSpeechSupported(
  //     typeof window !== "undefined" &&
  //       ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  //   );
  // }, []);

  /* ── cerrar modal al cambiar de ruta (navegación por bottom nav) ── */
  useEffect(() => {
    if (isOpen) handleClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* ── scroll lock + ESC close ── */
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") handleClose(); }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  function handleClose() {
    // recognitionRef.current?.stop();
    // setMicState("idle");
    setIsOpen(false);
    setText("");
    setForm(null);
    setNullFields(new Set());
  }

  /* ── voice (temporalmente deshabilitado) ── */
  // function startRecording() {
  //   const API = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  //   if (!API) return;
  //   const rec = new API();
  //   rec.lang = "es-ES";
  //   rec.continuous = true;
  //   rec.interimResults = true;
  //   let final = "";
  //   rec.onresult = (e: SpeechRecognitionEvent) => {
  //     let finalText = "";
  //     let interim = "";
  //     for (let i = 0; i < e.results.length; i++) {
  //       if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
  //       else interim += e.results[i][0].transcript;
  //     }
  //     final = finalText;
  //     setText(finalText + interim);
  //   };
  //   rec.onend = () => {
  //     setMicState("idle");
  //     if (final.trim()) { setText(final); handleParse(final); }
  //   };
  //   rec.onerror = () => setMicState("idle");
  //   recognitionRef.current = rec;
  //   rec.start();
  //   setMicState("recording");
  //   setText("");
  // }

  // function stopRecording() { recognitionRef.current?.stop(); }

  /* ── parse ── */
  async function handleParse(inputText?: string) {
    const src = inputText ?? text;
    if (!src.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch("/api/parse-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: src }),
      });
      const data: ParsedTransaction & { error?: string } = await res.json();
      if (!res.ok) { toast.error({ title: "Error al procesar", description: data.error }); return; }
      const nullSet = new Set<string>();
      if (data.amount === null)      nullSet.add("amount");
      if (data.type === null)        nullSet.add("type");
      if (data.categoryId === null)  nullSet.add("categoryId");
      if (data.accountId === null)   nullSet.add("accountId");
      if (data.description === null) nullSet.add("description");
      if (data.date === null)        nullSet.add("date");
      setNullFields(nullSet);
      setForm({
        amount:      data.amount      !== null ? String(data.amount) : "",
        type:        data.type        ?? "",
        categoryId:  data.categoryId  ?? "",
        accountId:   data.accountId   ?? "",
        description: data.description ?? "",
        date:        data.date        ?? "",
      });
    } catch { toast.error({ title: "Error de red al procesar" }); }
    finally   { setIsParsing(false); }
  }

  /* ── save ── */
  async function handleSave() {
    if (!form) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:      parseFloat(form.amount),
          type:        form.type,
          categoryId:  form.categoryId,
          accountId:   form.accountId,
          description: form.description || null,
          date:        form.date,
        }),
      });
      const data: { error?: string } = await res.json();
      if (!res.ok) { toast.error({ title: "Error al guardar", description: data.error }); return; }
      toast.success({ title: "Transacción guardada" });
      handleClose();
    } catch { toast.error({ title: "Error de red al guardar" }); }
    finally   { setIsSaving(false); }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setNullFields((prev) => { const n = new Set(prev); n.delete(field); return n; });
  }

  const highlight = (f: string) =>
    nullFields.has(f)
      ? "border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-200"
      : "border-gray-300 bg-white focus:border-indigo-500 focus:ring-indigo-200";

  const inputBase = "w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 transition-colors";

  return (
    <>
      {/* ── Floating Action Button ── */}
      {/* bottom-24 en móvil para quedar por encima del bottom nav (h-16) con margen */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* ── Modal / Bottom Sheet ── */}
      {/* z-[60] para quedar encima del bottom nav (z-50) en PWA móvil */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900">Nueva transacción</h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">

              {/* No accounts banner */}
              {accountsLoaded && accounts.length === 0 && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-sm">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-amber-800">
                    Sin cuentas creadas.{" "}
                    <Link href="/settings" onClick={handleClose} className="font-semibold underline hover:text-amber-900">
                      Crear en Configuración →
                    </Link>
                  </p>
                </div>
              )}

              {/* ── Text + Mic input ── */}
              <div className="space-y-3">
                <div className="flex gap-2 items-start">
                  <textarea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    placeholder="Ej: 'Pagué 45.50 en el supermercado hoy con tarjeta'"
                    rows={3}
                    className={`${inputBase} border-gray-300 bg-white focus:border-indigo-500 focus:ring-indigo-200 resize-none flex-1 min-h-[80px] overflow-hidden`}
                    disabled={isParsing}
                    autoFocus
                  />

                  {/* Mic button — temporalmente deshabilitado */}
                  {/* <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      type="button"
                      onClick={micState === "recording" ? stopRecording : startRecording}
                      disabled={!speechSupported || isParsing}
                      className={`relative p-2 rounded-full border transition-colors disabled:cursor-not-allowed
                        ${micState === "recording"
                          ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                          : speechSupported === false
                          ? "bg-gray-50 border-gray-200 text-gray-300"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                    >
                      {micState === "recording" && (
                        <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                      )}
                      <svg className="h-5 w-5 relative" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.93V21h-3a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-1.07A9 9 0 0 0 21 11a1 1 0 0 0-2 0 7 7 0 0 1-14 0 1 1 0 0 0-2 0 9 9 0 0 0 8 8.93z" />
                      </svg>
                    </button>
                  </div> */}
                </div>

                <button
                  onClick={() => handleParse()}
                  disabled={isParsing || !text.trim()}
                  className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isParsing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Procesando...
                    </>
                  ) : "Procesar"}
                </button>
              </div>

              {/* ── Review form ── */}
              {form && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Revisar y confirmar</p>
                    {nullFields.size > 0 && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                        {nullFields.size} campo{nullFields.size > 1 ? "s" : ""} por completar
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Monto {nullFields.has("amount") && <span className="text-amber-500">*</span>}
                      </label>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.amount}
                        onChange={(e) => updateField("amount", e.target.value)}
                        className={`${inputBase} ${highlight("amount")}`}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tipo {nullFields.has("type") && <span className="text-amber-500">*</span>}
                      </label>
                      <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className={`${inputBase} ${highlight("type")}`}>
                        <option value="">Seleccionar...</option>
                        <option value="INCOME">Ingreso</option>
                        <option value="EXPENSE">Gasto</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Categoría {nullFields.has("categoryId") && <span className="text-amber-500">*</span>}
                      </label>
                      <select value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)} className={`${inputBase} ${highlight("categoryId")}`}>
                        <option value="">Seleccionar...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {form.categoryId && (
                        <div className="mt-1.5 pl-1">
                          <CategoryBadge
                            name={categories.find((c) => c.id === form.categoryId)?.name ?? ""}
                            color={categories.find((c) => c.id === form.categoryId)?.color ?? "#6366f1"}
                          />
                        </div>
                      )}
                    </div>

                    {/* Account */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cuenta {nullFields.has("accountId") && <span className="text-amber-500">*</span>}
                      </label>
                      {accounts.length === 0 ? (
                        <div className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                          <Link href="/settings" onClick={handleClose} className="font-semibold underline">Crear en Configuración →</Link>
                        </div>
                      ) : (
                        <>
                          <select value={form.accountId} onChange={(e) => updateField("accountId", e.target.value)} className={`${inputBase} ${highlight("accountId")}`}>
                            <option value="">Seleccionar...</option>
                            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          {nullFields.has("accountId") && (
                            <p className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                              <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                              </svg>
                              Cuenta no encontrada.{" "}
                              <Link href="/settings" onClick={handleClose} className="font-semibold underline">Crear en Configuración</Link>
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Descripción {nullFields.has("description") && <span className="text-amber-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={form.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        className={`${inputBase} ${highlight("description")}`}
                        placeholder="Descripción de la transacción"
                      />
                    </div>

                    {/* Date */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fecha {nullFields.has("date") && <span className="text-amber-500">*</span>}
                      </label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => updateField("date", e.target.value)}
                        className={`${inputBase} ${highlight("date")}`}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !form.amount || !form.type || !form.categoryId || !form.accountId || !form.date}
                      className="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Guardando...
                        </>
                      ) : "Guardar"}
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
