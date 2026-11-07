import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import authService from "../../features/auth/authService";
import { updateAuthenticatedUser } from "../../features/auth/authSlice";

const emptyProfile = {
  name: "",
  username: "",
  avatar: "",
  bio: "",
};

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await authService.getProfile();
        const user = data?.user;

        setProfile({
          name: user?.name || "",
          username: user?.username || "",
          avatar: user?.avatar || "",
          bio: user?.bio || "",
        });
      } catch (requestError) {
        setError(
          requestError?.data?.message ||
            requestError?.message ||
            "Unable to load your profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = profile.name.trim();
    const username = profile.username.trim().toLowerCase();

    if (name.length < 3 || name.length > 50) {
      setError("Name must be between 3 and 50 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError("Username must be 3–30 letters, numbers, or underscores.");
      return;
    }

    if (profile.bio.length > 160) {
      setError("Bio must be 160 characters or fewer.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const data = await authService.updateProfile({
        name,
        username,
        avatar: profile.avatar.trim(),
        bio: profile.bio,
      });
      const user = data?.user;

      setProfile({
        name: user?.name || name,
        username: user?.username || username,
        avatar: user?.avatar || "",
        bio: user?.bio || "",
      });
      dispatch(updateAuthenticatedUser(user));
      setMessage(data?.message || "Profile updated successfully.");
    } catch (requestError) {
      setError(
        requestError?.data?.message ||
          requestError?.message ||
          "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F0D0C] px-4 py-8 text-[#F5EEE8] sm:py-12">
      <section className="mx-auto w-full max-w-xl rounded-2xl border border-[#3A302B]/80 bg-[#171311]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A89B91]">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Profile</h1>
            <p className="mt-2 text-sm text-[#A89B91]">
              Manage the information visible to your contacts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="rounded-lg border border-[#3A302B] px-3 py-2 text-sm text-[#F5EEE8] transition hover:border-[#C65D3B]/60"
          >
            Back to chat
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-lg border border-[#4E5C3C] bg-[#26301F]/60 px-4 py-3 text-sm text-[#D7E5C0]">
            {message}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-sm text-[#A89B91]">Loading profile…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm text-[#D8CBC1]">
              Display name
              <input
                name="name"
                value={profile.name}
                onChange={handleChange}
                autoComplete="name"
                className="mt-2 w-full rounded-lg border border-[#3A302B] bg-[#0F0D0C] px-4 py-3 outline-none transition focus:border-[#C65D3B]"
                required
              />
            </label>

            <label className="block text-sm text-[#D8CBC1]">
              Username
              <input
                name="username"
                value={profile.username}
                onChange={handleChange}
                autoComplete="username"
                className="mt-2 w-full rounded-lg border border-[#3A302B] bg-[#0F0D0C] px-4 py-3 outline-none transition focus:border-[#C65D3B]"
                required
              />
            </label>

            <label className="block text-sm text-[#D8CBC1]">
              Avatar URL
              <input
                name="avatar"
                type="url"
                value={profile.avatar}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                className="mt-2 w-full rounded-lg border border-[#3A302B] bg-[#0F0D0C] px-4 py-3 outline-none transition placeholder:text-[#A89B91]/70 focus:border-[#C65D3B]"
              />
            </label>

            <label className="block text-sm text-[#D8CBC1]">
              Bio <span className="text-[#A89B91]">({profile.bio.length}/160)</span>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                maxLength={160}
                rows={4}
                className="mt-2 w-full resize-y rounded-lg border border-[#3A302B] bg-[#0F0D0C] px-4 py-3 outline-none transition focus:border-[#C65D3B]"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[#C65D3B] px-4 py-3 font-semibold text-white transition hover:bg-[#E58B70] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving profile…" : "Save profile"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default Profile;
