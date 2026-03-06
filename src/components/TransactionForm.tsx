"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface Category {
  id: string;
  name: string;
}

interface Account {
  id: string;
  name: string;
}

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

export default function TransactionForm() {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [nullFields, setNullFields] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [micState, setMicState] = useState<"idle" | "recording">("idle");
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

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

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  function startRecording() {
    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setText(finalTranscript + interim);
    };

    recognition.onend = () => {
      setMicState("idle");
      if (finalTranscript.trim()) {
        setText(finalTranscript);
        handleParse(finalTranscript);
      }
    };

    recognition.onerror = () => {
      setMicState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setMicState("recording");
    setText("");
  }

  function stopRecording() {
    recognitionRef.current?.stop();
  }

  async function handleParse(inputText?: string) {
    const textToProcess = inputText ?? text;
    if (!textToProcess.trim()) return;
    setIsParsing(true);

    try {
      const res = await fetch("/api/parse-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToProcess }),
      });

      const data: ParsedTransaction & { error?: string } = await res.json();

      if (!res.ok) {
        toast.error({ title: "Error al procesar la transacción", description: data.error });
        return;
      }

      const nullSet = new Set<string>();
      if (data.amount === null) nullSet.add("amount");
      if (data.type === null) nullSet.add("type");
      if (data.categoryId === null) nullSet.add("categoryId");
      if (data.accountId === null) nullSet.add("accountId");
      if (data.description === null) nullSet.add("description");
      if (data.date === null) nullSet.add("date");

      setNullFields(nullSet);
      setForm({
        amount: data.amount !== null ? String(data.amount) : "",
        type: data.type ?? "",
        categoryId: data.categoryId ?? "",
        accountId: data.accountId ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
      });
    } catch {
      toast.error({ title: "Error de red al procesar la transacción" });
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          type: form.type,
          categoryId: form.categoryId,
          accountId: form.accountId,
          description: form.description || null,
          date: form.date,
        }),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        toast.error({ title: "Error al guardar la transacción", description: data.error });
        return;
      }

      toast.success({ title: "Transacción guardada exitosamente" });
      setText("");
      setForm(null);
      setNullFields(new Set());
    } catch {
      toast.error({ title: "Error de red al guardar la transacción" });
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setNullFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  const highlightClass = (field: string) =>
    nullFields.has(field)
      ? "border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-200"
      : "border-gray-300 bg-white focus:border-indigo-500 focus:ring-indigo-200";

  const inputBase =
    "w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 transition-colors";

  return (
    <div className="space-y-6">
      {/* No accounts warning banner */}
      {accountsLoaded && accounts.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-amber-800">
            No tienes ninguna cuenta creada. Para registrar transacciones primero debes{" "}
            <Link href="/settings" className="font-semibold underline hover:text-amber-900">
              crear una cuenta en Configuración
            </Link>
            .
          </p>
        </div>
      )}

      {/* Natural language input */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Nueva transacción
        </h2>
        <div className="space-y-3">
          <div className="flex gap-2 items-start">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe tu transacción, ej: 'Pagué 45.50 en el supermercado hoy con tarjeta'"
              rows={3}
              className={`${inputBase} border-gray-300 bg-white focus:border-indigo-500 focus:ring-indigo-200 resize-none flex-1`}
              disabled={isParsing || micState === "recording"}
            />
            <div className="flex flex-col items-center gap-1 pt-1">
              <button
                type="button"
                onClick={micState === "recording" ? stopRecording : startRecording}
                disabled={!speechSupported || isParsing}
                title={
                  !speechSupported
                    ? "Solo disponible en Chrome/Edge"
                    : micState === "recording"
                    ? "Detener grabación"
                    : "Iniciar grabación de voz"
                }
                className={`relative p-2 rounded-full border transition-colors disabled:cursor-not-allowed
                  ${
                    micState === "recording"
                      ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                      : isParsing
                      ? "bg-gray-50 border-gray-200 text-gray-400"
                      : speechSupported === false
                      ? "bg-gray-50 border-gray-200 text-gray-300"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
              >
                {isParsing ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                ) : micState === "recording" ? (
                  <>
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                    <svg
                      className="h-5 w-5 relative"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.93V21h-3a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-1.07A9 9 0 0 0 21 11a1 1 0 0 0-2 0 7 7 0 0 1-14 0 1 1 0 0 0-2 0 9 9 0 0 0 8 8.93z" />
                    </svg>
                  </>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.93V21h-3a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-1.07A9 9 0 0 0 21 11a1 1 0 0 0-2 0 7 7 0 0 1-14 0 1 1 0 0 0-2 0 9 9 0 0 0 8 8.93z" />
                  </svg>
                )}
              </button>
              {speechSupported === false && (
                <span className="text-[10px] text-center text-gray-400 leading-tight max-w-[60px]">
                  Solo Chrome/Edge
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleParse()}
              disabled={isParsing || !text.trim() || micState === "recording"}
              className="w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isParsing ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Procesando...
                </>
              ) : (
                "Procesar"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Review form */}
      {form && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Revisar y confirmar
            </h2>
            {nullFields.size > 0 && (
              <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-2 py-1">
                {nullFields.size} campo{nullFields.size > 1 ? "s" : ""} por completar
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Monto
                {nullFields.has("amount") && (
                  <span className="ml-1 text-amber-500">*</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                className={`${inputBase} ${highlightClass("amount")}`}
                placeholder="0.00"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo
                {nullFields.has("type") && (
                  <span className="ml-1 text-amber-500">*</span>
                )}
              </label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className={`${inputBase} ${highlightClass("type")}`}
              >
                <option value="">Seleccionar...</option>
                <option value="INCOME">Ingreso</option>
                <option value="EXPENSE">Gasto</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Categoría
                {nullFields.has("categoryId") && (
                  <span className="ml-1 text-amber-500">*</span>
                )}
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
                className={`${inputBase} ${highlightClass("categoryId")}`}
              >
                <option value="">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cuenta
                {nullFields.has("accountId") && (
                  <span className="ml-1 text-amber-500">*</span>
                )}
              </label>
              {accounts.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <span>
                    Sin cuentas.{" "}
                    <Link href="/settings" className="font-semibold underline hover:text-amber-900">
                      Crear en Configuración →
                    </Link>
                  </span>
                </div>
              ) : (
                <>
                  <select
                    value={form.accountId}
                    onChange={(e) => updateField("accountId", e.target.value)}
                    className={`${inputBase} ${highlightClass("accountId")}`}
                  >
                    <option value="">Seleccionar...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {nullFields.has("accountId") && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                      </svg>
                      La cuenta que mencionaste no existe aún. Selecciónala manualmente o{" "}
                      <Link href="/settings" className="font-semibold underline hover:text-amber-900">
                        créala en Configuración
                      </Link>
                      .
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descripción
                {nullFields.has("description") && (
                  <span className="ml-1 text-amber-500">*</span>
                )}
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                className={`${inputBase} ${highlightClass("description")}`}
                placeholder="Descripción de la transacción"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha
                {nullFields.has("date") && (
                  <span className="ml-1 text-amber-500">*</span>
                )}
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className={`${inputBase} ${highlightClass("date")}`}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={
                isSaving ||
                !form.amount ||
                !form.type ||
                !form.categoryId ||
                !form.accountId ||
                !form.date
              }
              className="w-full sm:w-auto px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </button>
            <button
              onClick={() => {
                setForm(null);
                setNullFields(new Set());
              }}
              className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
