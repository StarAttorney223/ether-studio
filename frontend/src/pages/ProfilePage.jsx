import { Camera, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import Toast from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/avatar";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    setName(user?.name || "");
    setAvatar(user?.avatar || "");
  }, [user]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      setAvatar(dataUrl);
    } catch {
      setToast({ message: "Unable to process selected image.", type: "error" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, avatar });
      setToast({ message: "Profile updated.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Unable to update profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-4xl studio-animate-in">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <BackButton />
          <h1 className="text-5xl font-bold">Profile</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name || "User avatar"}
                    className="h-40 w-40 rounded-full object-cover ring-4 ring-[#efe4ff]"
                  />
                ) : (
                  <div className="grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-[#5e2de5] to-[#9a79ff] text-4xl font-bold text-white ring-4 ring-[#efe4ff]">
                    {getInitials(name || user?.name)}
                  </div>
                )}
                <label className="absolute bottom-2 right-2 grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-white text-gray-900 shadow-glow dark:bg-gray-800 dark:text-white">
                  <Camera size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">{name || user?.name || "Your profile"}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Click the camera icon to upload a new avatar.</p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-700 dark:bg-gray-800">
            <div className="grid gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-studio-primary">Account Details</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Manage your profile</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  Keep your display name and avatar up to date across the app.
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Display Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 w-full rounded-2xl bg-gray-100 px-4 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
                  placeholder="Your display name"
                />
              </label>

              <div className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-700">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-300">Email</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                  <Mail size={16} className="text-studio-primary" />
                  <span>{user?.email}</span>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Avatar URL or Base64</span>
                <textarea
                  value={avatar}
                  onChange={(event) => setAvatar(event.target.value)}
                  className="h-28 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
                  placeholder="Paste an image URL or keep the uploaded base64 value"
                />
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="h-12 rounded-full bg-gradient-to-r from-[#6639ec] to-[#9a79ff] text-sm font-semibold text-white shadow-glow disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </section>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

export default ProfilePage;
