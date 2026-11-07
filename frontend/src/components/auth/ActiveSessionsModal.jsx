import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import authService from "../../features/auth/authService";
import { logoutUser } from "../../features/auth/authSlice";
import socketService from "../../features/chat/socketService";
function ActiveSessionsModal({ onClose }) {
  const dispatch = useDispatch();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await authService.getSessions();

        setSessions(data?.sessions || []);
      } catch (err) {
        setError(
          err?.data?.message ||
            err?.message ||
            "Failed to load active sessions.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const handleLogout = async () => {
    try {
      socketService.disconnectSocket();

      await dispatch(logoutUser());
    } finally {
      onClose();
    }
  };
  const handleRevoke = async (sessionId) => {
    if (revokingId) return;

    try {
      setRevokingId(sessionId);
      setError("");

      await authService.revokeSession(sessionId);

      setSessions((previousSessions) =>
        previousSessions.filter(
          (session) => String(session.id) !== String(sessionId),
        ),
      );
    } catch (err) {
      setError(
        err?.data?.message || err?.message || "Failed to revoke session.",
      );
    } finally {
      setRevokingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleString();
  };

  const getDeviceLabel = (session) => {
    if (session.device) {
      return session.device;
    }

    if (session.userAgent) {
      return session.userAgent;
    }

    return "Unknown device";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#3A302B]/80 bg-[#171311] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3A302B]/70 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F5EEE8]">
              Active Sessions
            </h2>

            <p className="mt-1 text-xs text-[#A89B91]">
              Manage devices currently signed in to your account.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A89B91] transition hover:bg-[#2C2521] hover:text-[#F5EEE8]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto p-4">
          {loading && (
            <div className="py-10 text-center text-sm text-[#A89B91]">
              Loading sessions...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-[#633326]/50 bg-[#633326]/15 p-4 text-sm text-[#E58B70]">
              {error}
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-[#F5EEE8]">
                No active sessions found.
              </p>

              <p className="mt-1 text-xs text-[#A89B91]">
                Your current login session may have expired.
              </p>
            </div>
          )}

          {!loading && !error && sessions.length > 0 && (
            <div className="space-y-3">
              {sessions.map((session) => {
                const isCurrent = Boolean(session.current);
                const isRevoking = String(revokingId) === String(session.id);

                return (
                  <div
                    key={session.id}
                    className="rounded-xl border border-[#3A302B]/70 bg-[#211B18]/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-[#F5EEE8]">
                            {getDeviceLabel(session)}
                          </p>

                          {isCurrent && (
                            <span className="shrink-0 rounded-full border border-[#78C091]/30 bg-[#78C091]/10 px-2 py-0.5 text-[10px] font-medium text-[#78C091]">
                              Current
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1 text-[11px] text-[#A89B91]">
                          <p>
                            IP:{" "}
                            <span className="text-[#C9BDB5]">
                              {session.ipAddress || "Unavailable"}
                            </span>
                          </p>

                          <p>
                            Created:{" "}
                            <span className="text-[#C9BDB5]">
                              {formatDate(session.createdAt)}
                            </span>
                          </p>

                          <p>
                            Last used:{" "}
                            <span className="text-[#C9BDB5]">
                              {formatDate(session.lastUsedAt)}
                            </span>
                          </p>

                          <p>
                            Expires:{" "}
                            <span className="text-[#C9BDB5]">
                              {formatDate(session.expiresAt)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {isCurrent ? (
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="shrink-0 rounded-lg border border-[#633326]/60 px-3 py-2 text-xs font-medium text-[#E58B70] transition hover:bg-[#633326]/20"
                        >
                          Log out
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevoke(session.id)}
                          disabled={isRevoking}
                          className="shrink-0 rounded-lg border border-[#633326]/60 px-3 py-2 text-xs font-medium text-[#E58B70] transition hover:bg-[#633326]/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRevoking ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActiveSessionsModal;
