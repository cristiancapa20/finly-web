"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import TransactionForm from "@/components/TransactionForm";

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

export default function QuickTransactionButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
    setIsOpen(false);
  }

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
            <div className="overflow-y-auto flex-1 p-5">
              <TransactionForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
