"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Camera, User } from "lucide-react";
import { sileo } from "sileo";

interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setProfile(data.data);
          setDisplayName(data.data.displayName ?? "");
          setAvatar(data.data.avatar ?? null);
        }
      });
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      sileo.error({ title: "La imagen no puede superar 2MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, avatar }),
      });

      if (res.ok) {
        await update({ user: { ...session?.user, name: displayName || profile?.username } });
        router.refresh();
        sileo.success({ title: "Perfil actualizado" });
      } else {
        sileo.error({ title: "Error al guardar el perfil" });
      }
    } finally {
      setSaving(false);
    }
  }

  const initials = (displayName || profile?.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center cursor-pointer ring-4 ring-indigo-50"
              onClick={() => fileRef.current?.click()}
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-md"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-gray-400">JPG, PNG o GIF · Máx. 2MB</p>
          {avatar && (
            <button
              type="button"
              onClick={() => { setAvatar(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Eliminar foto
            </button>
          )}
        </div>

        {/* Username (read only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario
          </label>
          <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
            <User className="w-4 h-4" />
            {profile?.username}
          </div>
          <p className="text-xs text-gray-400 mt-1">El nombre de usuario no se puede cambiar</p>
        </div>

        {/* Display name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre a mostrar
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder={profile?.username ?? "Tu nombre"}
          />
          <p className="text-xs text-gray-400 mt-1">Este nombre aparecerá en el menú</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
