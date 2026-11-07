import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../features/auth/authService";

function Sessions() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authService.getSessions();

      /*
       * Backend may return the sessions directly or
       * inside a sessions property.
       */
      const sessionList = Array.isArray(data)
        ? data
        : data?.sessions || [];

      setSessions(sessionList);
    } catch (error) {
      setError(
        error?.data?.message ||
          error?.message ||
          "Failed to load sessions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevoke = async (sessionId) => {
    try {
      setRevokingId(sessionId);
      setError("");
      setMessage("");

      await authService.revokeSession(sessionId);

      setSessions((currentSessions) =>
        currentSessions.filter(
          (session) =>
            (session._id || session.id) !== sessionId,
        ),
      );

      setMessage("Session revoked successfully.");
    } catch (error) {
      setError(
        error?.data?.message ||
          error?.message ||
          "Failed to revoke session.",
      );
    } finally {
      setRevokingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    return parsedDate.toLocaleString();
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <section className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="mb-5 text-sm text-slate-400 hover:text-white"
          >
            ← Back to Chat
          </button>

          <h1 className="text-3xl font-bold">
            Active Sessions
          </h1>

          <p className="mt-2 text-slate-400">
            Manage devices where your account is currently
            signed in.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-green-900 bg-green-950/50 px-4 py-3 text-sm text-green-300">
            {message}
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg font-medium">
                No active sessions found.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Your current login session may not be listed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const sessionId =
                  session._id || session.id;

                return (
                  <div
                    key={sessionId}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-white">
                          {session.device || "Unknown Device"}
                        </h2>

                        <div className="mt-2 space-y-1 text-sm text-slate-400">
                          <p>
                            User Agent:{" "}
                            {session.userAgent || "Unknown"}
                          </p>

                          <p>
                            IP Address:{" "}
                            {session.ipAddress || "Unknown"}
                          </p>

                          <p>
                            Created:{" "}
                            {formatDate(session.createdAt)}
                          </p>

                          <p>
                            Expires:{" "}
                            {formatDate(session.expiresAt)}
                          </p>

                          {session.revokedAt && (
                            <p className="text-red-400">
                              Revoked:{" "}
                              {formatDate(session.revokedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevoke(sessionId)}
                        disabled={revokingId === sessionId}
                        className="shrink-0 rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {revokingId === sessionId
                          ? "Revoking..."
                          : "Revoke"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Sessions;