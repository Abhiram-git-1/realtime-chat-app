function ConversationItem({
  conversation,
  currentUserId,
  active,
  onClick,
  isOnline,
}) {
  const members = conversation.members || [];

  const otherMember =
    conversation.type === "direct"
      ? members.find(
          (member) => String(member.userId?._id) !== String(currentUserId),
        )
      : null;

  const title =
    conversation.type === "direct"
      ? otherMember?.userId?.name ||
        otherMember?.userId?.username ||
        "Unknown user"
      : conversation.name || "Group conversation";

  const avatar =
    conversation.type === "direct"
      ? otherMember?.userId?.avatar
      : conversation.avatar;

  const initial = title?.charAt(0)?.toUpperCase() || "?";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
        active
          ? "border border-[#C65D3B]/30 bg-[#633326]/35"
          : "border border-transparent hover:border-[#3A302B] hover:bg-[#211B18]/70"
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={title}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${
              active
                ? "bg-[#C65D3B] text-[#F5EEE8]"
                : "bg-[#2C2521] text-[#C65D3B]"
            }`}
          >
            {initial}
          </div>
        )}

        {conversation.type === "direct" && (
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#171311] ${
              isOnline
                ? "bg-[#78C091] shadow-[0_0_8px_rgba(120,192,145,0.5)]"
                : "bg-[#3A302B]"
            }`}
          />
        )}
      </div>

      {/* Conversation info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-[#F5EEE8]">{title}</p>

          {conversation.lastMessageAt && (
            <span className="shrink-0 text-[10px] text-[#A89B91]">
              {new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-xs text-[#A89B91]">
          {conversation.lastMessage?.deletedAt
            ? "This message was deleted"
            : conversation.lastMessage?.content || "No messages yet"}
        </p>
      </div>
    </button>
  );
}

export default ConversationItem;
