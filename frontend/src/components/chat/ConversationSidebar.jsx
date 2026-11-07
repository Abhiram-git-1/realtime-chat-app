import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  createConversation,
  fetchConversations,
  searchConversations,
  searchUsers,
  clearSearchResults,
} from "../../features/chat/chatSlice";

import ConversationItem from "./ConversationItem";
import {
  logoutUser,
  logoutAllUsers,
  clearCredentials,
} from "../../features/auth/authSlice";
import socketService from "../../features/chat/socketService";
import ActiveSessionsModal from "../auth/ActiveSessionsModal";
function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  mobileHidden,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const {
    searchUsers: users,
    searchConversations: searchedConversations,
    searchLoading,
    onlineUsers,
  } = useSelector((state) => state.chat);

  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  useEffect(() => {
    const query = search.trim();

    if (!query) {
      dispatch(clearSearchResults());
      return;
    }

    const timer = setTimeout(() => {
      dispatch(searchUsers(query));
      dispatch(searchConversations(query));
    }, 300);

    return () => clearTimeout(timer);
  }, [dispatch, search]);

  const handleCreateDirectConversation = async (targetUser) => {
    if (creating) {
      return;
    }

    try {
      setCreating(true);

      /*
       * First check whether this direct conversation
       * already exists in the conversations already
       * loaded by GET /conversations.
       *
       * GET /conversations includes the populated members,
       * so this gives us the complete conversation object.
       */
      const existingConversation = conversations.find((conversation) => {
        if (conversation.type !== "direct") {
          return false;
        }

        return conversation.members?.some(
          (member) => String(member.userId?._id) === String(targetUser._id),
        );
      });

      /*
       * If the conversation already exists,
       * simply open it.
       */
      if (existingConversation) {
        setSearch("");
        setShowNewChat(false);

        await onSelectConversation(existingConversation);

        return;
      }

      /*
       * No existing conversation found,
       * so create a new direct conversation.
       */
      const result = await dispatch(
        createConversation({
          type: "direct",
          memberIds: [targetUser._id],
        }),
      ).unwrap();

      const createdConversation = result?.conversation || result;

      if (!createdConversation?._id) {
        return;
      }

      /*
       * Refresh the conversation list because
       * GET /conversations returns the fully populated
       * members array.
       */
      const conversationsResult = await dispatch(fetchConversations()).unwrap();

      const updatedConversations =
        conversationsResult?.conversations || conversationsResult || [];

      const fullConversation = updatedConversations.find(
        (conversation) =>
          String(conversation._id) === String(createdConversation._id),
      );

      if (!fullConversation) {
        return;
      }

      setSearch("");
      setShowNewChat(false);

      await onSelectConversation(fullConversation);
    } catch {
      // Redux stores the error.
    } finally {
      setCreating(false);
    }
  };

  const handleSearchConversationClick = async (conversation) => {
    setSearch("");
    setShowNewChat(false);

    /*
     * /search/conversations does NOT return members.
     *
     * GET /conversations DOES return members.
     *
     * Therefore find the same conversation from the
     * already-loaded full conversation list.
     */
    let fullConversation = conversations.find(
      (item) => String(item._id) === String(conversation._id),
    );

    /*
     * Safety fallback:
     * if it isn't currently in Redux, refresh the
     * conversation list and try again.
     */
    if (!fullConversation) {
      const result = await dispatch(fetchConversations()).unwrap();

      const updatedConversations = result?.conversations || result || [];

      fullConversation = updatedConversations.find(
        (item) => String(item._id) === String(conversation._id),
      );
    }

    if (!fullConversation) {
      return;
    }

    await onSelectConversation(fullConversation);
  };

  const hasSearchResults = users.length > 0 || searchedConversations.length > 0;

  const handleLogout = async () => {
    if (creating) return;

    try {
      socketService.disconnectSocket();

      await dispatch(logoutUser()).unwrap();

      setShowAccountMenu(false);
    } catch {
      // logoutUser clears local authentication even if the backend request fails.
      setShowAccountMenu(false);
    }
  };
  const handleLogoutAll = async () => {
    try {
      socketService.disconnectSocket();

      await dispatch(logoutAllUsers());
    } finally {
      dispatch(clearCredentials());
      setShowAccountMenu(false);
    }
  };
  return (
    <>
    <aside className={`${mobileHidden ? "hidden md:flex" : "flex"} w-full max-w-sm flex-col border-r border-[#3A302B]/70 bg-[#171311]/75 backdrop-blur-xl`}>
      {/* Header */}
      <div className="border-b border-[#3A302B]/70 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A89B91]">
              Messages
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#F5EEE8]">
              Chats
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setShowNewChat(true);
              onNewConversation();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#3A302B] bg-[#211B18]/80 text-xl text-[#C65D3B] transition hover:border-[#C65D3B]/50 hover:bg-[#633326]/30"
            title="New conversation"
          >
            +
          </button>
        </div>

        {/* Search */}
        <div className="mt-5 flex items-center rounded-xl border border-[#3A302B] bg-[#0F0D0C]/60 px-3 transition focus-within:border-[#C65D3B]/50">
          <span className="text-lg text-[#A89B91]">⌕</span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              showNewChat ? "Search people..." : "Search conversations..."
            }
            className="w-full bg-transparent px-3 py-2.5 text-sm text-[#F5EEE8] outline-none placeholder:text-[#A89B91]/70"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs text-[#A89B91] hover:text-[#F5EEE8]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {search.trim() && hasSearchResults ? (
        <div className="border-b border-[#3A302B]/70 px-3 py-3">
          {/* Users */}
          {users.length > 0 && (
            <div>
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A89B91]">
                People
              </p>

              <div className="space-y-1">
                {users.map((foundUser) => (
                  <button
                    key={foundUser._id}
                    type="button"
                    onClick={() => handleCreateDirectConversation(foundUser)}
                    disabled={
                      creating || String(foundUser._id) === String(user?.id)
                    }
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-[#211B18] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {foundUser.avatar ? (
                      <img
                        src={foundUser.avatar}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2C2521] text-sm font-semibold text-[#C65D3B]">
                        {foundUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#F5EEE8]">
                        {foundUser.name || foundUser.username}
                      </p>

                      <p className="truncate text-xs text-[#A89B91]">
                        @{foundUser.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversations */}
          {searchedConversations.length > 0 && (
            <div className={users.length > 0 ? "mt-4" : ""}>
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A89B91]">
                Conversations
              </p>

              <div className="space-y-1">
                {searchedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation._id}
                    conversation={conversation}
                    currentUserId={user?.id}
                    active={conversation._id === activeConversationId}
                    onClick={() => handleSearchConversationClick(conversation)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Loading search */}
      {search.trim() && searchLoading && (
        <div className="px-5 py-4 text-xs text-[#A89B91]">Searching...</div>
      )}

      {/* No search results */}
      {search.trim() && !searchLoading && !hasSearchResults && (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-[#F5EEE8]">No results found</p>

          <p className="mt-1 text-xs text-[#A89B91]">
            Try another name or username.
          </p>
        </div>
      )}

      {/* Normal conversation list */}
      {!search.trim() && (
        <div className="flex-1 overflow-y-auto p-3">
          {conversations.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#3A302B] bg-[#211B18]/70 text-2xl">
                  💬
                </div>

                <p className="mt-4 text-sm font-medium text-[#F5EEE8]">
                  No conversations yet
                </p>

                <p className="mt-1 text-xs leading-5 text-[#A89B91]">
                  Click + to start a new conversation.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {conversations.map((conversation) => {
                const otherMember =
                  conversation.type === "direct"
                    ? conversation.members?.find(
                        (member) =>
                          String(member.userId?._id) !== String(user?.id),
                      )
                    : null;

                const isOnline =
                  conversation.type === "direct" &&
                  onlineUsers.some(
                    (onlineUser) =>
                      String(onlineUser._id) ===
                      String(otherMember?.userId?._id),
                  );

                return (
                  <ConversationItem
                    key={conversation._id}
                    conversation={conversation}
                    currentUserId={user?.id}
                    active={conversation._id === activeConversationId}
                    isOnline={isOnline}
                    onClick={() => onSelectConversation(conversation)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom account */}
      <div className="border-t border-[#3A302B]/70 p-4">
        <button
          type="button"
          onClick={() => setShowAccountMenu((previous) => !previous)}
          className="flex w-full items-center gap-3 rounded-xl border border-[#3A302B]/60 bg-[#211B18]/50 p-3 text-left transition hover:border-[#C65D3B]/40 hover:bg-[#2C2521]/70"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2C2521] text-sm font-semibold text-[#C65D3B]">
              {user?.name?.charAt(0)?.toUpperCase() ||
                user?.username?.charAt(0)?.toUpperCase() ||
                "U"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[#F5EEE8]">
              {user?.name || user?.username || "User"}
            </p>

            <p className="truncate text-[11px] text-[#A89B91]">
              @{user?.username || "user"}
            </p>
          </div>

          <span className="text-[#A89B91]">⋮</span>
        </button>
        {showAccountMenu && (
          <div className="mt-2 overflow-hidden rounded-xl border border-[#3A302B]/70 bg-[#211B18]/95 shadow-xl backdrop-blur-xl">
            <div className="border-b border-[#3A302B]/70 px-4 py-3">
              <p className="text-xs font-medium text-[#F5EEE8]">
                {user?.name || user?.username || "User"}
              </p>

              <p className="mt-0.5 text-[11px] text-[#A89B91]">
                @{user?.username || "user"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAccountMenu(false);
                navigate("/profile");
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#F5EEE8] transition hover:bg-[#2C2521]"
            >
              <span>👤</span>
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAccountMenu(false);
                navigate("/change-password");
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#F5EEE8] transition hover:bg-[#2C2521]"
            >
              <span>🔐</span>
              <span>Change Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAccountMenu(false);
                setShowSessions(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#F5EEE8] transition hover:bg-[#2C2521]"
            >
              <span>🖥️</span>
              <span>Active Sessions</span>
            </button>

            <div className="my-1 border-t border-[#3A302B]/70" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#E58B70] transition hover:bg-[#633326]/20"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>

            <button
              type="button"
              onClick={handleLogoutAll}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#E58B70] transition hover:bg-[#633326]/20"
            >
              <span>🚪</span>
              <span>Logout from All Devices</span>
            </button>
          </div>
        )}
      </div>
    </aside>
    {showSessions && (
      <ActiveSessionsModal
        onClose={() => setShowSessions(false)}
      />
    )}
  </>
  );
}

export default ConversationSidebar;
