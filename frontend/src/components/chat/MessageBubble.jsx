import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  updateMessage,
  deleteMessage,
  fetchConversations,
} from "../../features/chat/chatSlice";

function MessageBubble({ message }) {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const currentUserId = user?._id || user?.id;

  const senderId =
    typeof message.senderId === "object"
      ? message.senderId?._id
      : message.senderId;

  const isOwnMessage = String(senderId) === String(currentUserId);

  const deliveryStatus = message.deliveryStatus || [];

  const recipientDelivery = deliveryStatus.find(
    (delivery) =>
      String(delivery.userId?._id || delivery.userId) !== String(senderId),
  );

  const isDelivered = isOwnMessage && Boolean(recipientDelivery?.deliveredAt);

  const isRead = isOwnMessage && Boolean(recipientDelivery?.readAt);

  const isDeleted = Boolean(message.deletedAt) || message.content === null;

  const senderName =
    typeof message.senderId === "object"
      ? message.senderId?.name || message.senderId?.username || "Unknown user"
      : "Unknown user";

  const handleStartEdit = () => {
    setEditContent(message.content || "");
    setLocalError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content || "");
    setLocalError("");
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    const trimmedContent = editContent.trim();

    if (!trimmedContent) {
      setLocalError("Message cannot be empty.");
      return;
    }

    if (trimmedContent === message.content) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setLocalError("");

    try {
      await dispatch(
        updateMessage({
          messageId: message._id,
          content: trimmedContent,
        }),
      ).unwrap();

      setIsEditing(false);
    } catch (err) {
      setLocalError(err?.message || "Failed to update message.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this message?");

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setLocalError("");

    try {
      await dispatch(deleteMessage(message._id)).unwrap();
      await dispatch(fetchConversations()).unwrap();
    } catch (err) {
      setLocalError(err?.message || "Failed to delete message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`group flex w-full ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] ${isOwnMessage ? "items-end" : "items-start"}`}
      >
        {!isOwnMessage && (
          <p className="mb-1 px-1 text-xs font-medium text-[#A89B91]">
            {senderName}
          </p>
        )}

        <div
          className={`relative rounded-2xl border px-4 py-3 ${
            isOwnMessage
              ? "rounded-br-md border-[#633326] bg-[#633326]"
              : "rounded-bl-md border-[#3A302B] bg-[#2C2521]"
          }`}
        >
          {isEditing ? (
            <div className="min-w-[240px]">
              <textarea
                value={editContent}
                onChange={(event) => {
                  setEditContent(event.target.value);
                  setLocalError("");
                }}
                maxLength={5000}
                autoFocus
                rows={3}
                className="w-full resize-none rounded-xl border border-[#3A302B] bg-[#0F0D0C]/70 px-3 py-2 text-sm text-[#F5EEE8] outline-none focus:border-[#C65D3B]"
              />

              {localError && (
                <p className="mt-2 text-xs text-[#D87552]">{localError}</p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="rounded-lg border border-[#3A302B] px-3 py-1.5 text-xs text-[#A89B91] transition hover:bg-[#2C2521] hover:text-[#F5EEE8] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="rounded-lg bg-[#C65D3B] px-3 py-1.5 text-xs font-medium text-[#F5EEE8] transition hover:bg-[#D87552] disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : isDeleted ? (
            <p className="text-sm italic text-[#A89B91]">
              This message was deleted
            </p>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#F5EEE8]">
                {message.content}
              </p>

              {message.editedAt && (
                <span className="ml-2 text-[10px] text-[#A89B91]">edited</span>
              )}

              <div
                className={`mt-1 flex items-center gap-1 ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <span className="text-[10px] text-[#A89B91]">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {isOwnMessage && (
                  <span
                    className={`text-[10px] font-semibold ${
                      isRead
                        ? "text-[#C65D3B]"
                        : isDelivered
                          ? "text-[#78C091]"
                          : "text-[#A89B91]"
                    }`}
                    title={isRead ? "Read" : isDelivered ? "Delivered" : "Sent"}
                  >
                    {isDelivered ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </>
          )}

          {isOwnMessage && !isDeleted && !isEditing && (
            <div className="absolute -top-8 right-0 hidden items-center gap-1 rounded-lg border border-[#3A302B] bg-[#171311] p-1 shadow-lg group-hover:flex">
              <button
                type="button"
                onClick={handleStartEdit}
                disabled={loading}
                className="rounded-md px-2 py-1 text-xs text-[#A89B91] transition hover:bg-[#2C2521] hover:text-[#F5EEE8]"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="rounded-md px-2 py-1 text-xs text-[#D87552] transition hover:bg-[#633326] hover:text-[#F5EEE8]"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {localError && !isEditing && (
          <p className="mt-1 px-1 text-xs text-[#D87552]">{localError}</p>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
