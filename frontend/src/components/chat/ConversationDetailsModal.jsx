import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  addMember,
  fetchMembers,
  searchUsers,
  removeMember,
  updateMember,
  updateConversation,
  deleteConversation,
} from "../../features/chat/chatSlice";

function ConversationDetailsModal({
  conversation,
  onClose,
  onConversationDeleted,
}) {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  const {
    members,
    membersLoading,
    searchUsers: users,
    searchLoading,
    error,
  } = useSelector((state) => state.chat);

  const [showAddMembers, setShowAddMembers] = useState(false);

  const [search, setSearch] = useState("");
  const [addingUserId, setAddingUserId] = useState(null);
  const [localError, setLocalError] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.name || "");
  const [updatingName, setUpdatingName] = useState(false);

  useEffect(() => {
    if (!conversation?._id) {
      return;
    }

    dispatch(fetchMembers(conversation._id));
  }, [dispatch, conversation?._id]);

  /*
   * Search users when Add Members is open.
   */
  useEffect(() => {
    const query = search.trim();

    if (!showAddMembers || !query) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch(searchUsers(query));
    }, 300);

    return () => clearTimeout(timer);
  }, [dispatch, search, showAddMembers]);

  if (!conversation) {
    return null;
  }

  const isDirect = conversation.type === "direct";

  const title = isDirect
    ? "Conversation Details"
    : conversation.name || "Group Details";

  /*
   * IDs of users who are already members.
   */
  const memberIds = new Set(
    members.map((member) => String(member.userId?._id)),
  );

  /*
   * Only show users who aren't already members
   * and aren't the current logged-in user.
   */
  const availableUsers = users.filter((foundUser) => {
    const isCurrentUser = String(foundUser._id) === String(user?.id);

    const isAlreadyMember = memberIds.has(String(foundUser._id));

    return !isCurrentUser && !isAlreadyMember;
  });

  const handleAddMember = async (foundUser) => {
    if (addingUserId) {
      return;
    }

    setLocalError("");
    setAddingUserId(foundUser._id);

    try {
      await dispatch(
        addMember({
          conversationId: conversation._id,
          userId: foundUser._id,
        }),
      ).unwrap();

      /*
       * Refetch authoritative member list.
       */
      await dispatch(fetchMembers(conversation._id)).unwrap();

      setSearch("");
      setShowAddMembers(false);
    } catch (err) {
      setLocalError(err?.message || "Failed to add member.");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRemoveMember = async (member) => {
    if (addingUserId) {
      return;
    }

    const memberUserId = member.userId?._id;

    if (!memberUserId) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${
        member.userId?.name || member.userId?.username || "this member"
      } from the group?`,
    );

    if (!confirmed) {
      return;
    }

    setLocalError("");
    setAddingUserId(memberUserId);

    try {
      await dispatch(
        removeMember({
          conversationId: conversation._id,
          userId: memberUserId,
        }),
      ).unwrap();

      await dispatch(fetchMembers(conversation._id)).unwrap();
    } catch (err) {
      setLocalError(err?.message || "Failed to remove member.");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleChangeRole = async (member, newRole) => {
    const memberUserId = member.userId?._id;

    if (!memberUserId || !newRole || member.role === newRole) {
      return;
    }

    setLocalError("");
    setAddingUserId(memberUserId);

    try {
      await dispatch(
        updateMember({
          conversationId: conversation._id,
          userId: memberUserId,
          data: {
            role: newRole,
          },
        }),
      ).unwrap();

      await dispatch(fetchMembers(conversation._id)).unwrap();
    } catch (err) {
      setLocalError(err?.message || "Failed to update member role.");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleUpdateConversationName = async () => {
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      setLocalError("Group name cannot be empty.");
      return;
    }

    if (trimmedName === conversation?.name) {
      setEditingName(false);
      return;
    }

    setLocalError("");
    setUpdatingName(true);

    try {
      await dispatch(
        updateConversation({
          conversationId: conversation._id,
          data: {
            name: trimmedName,
          },
        }),
      ).unwrap();

      setEditingName(false);
    } catch (err) {
      setLocalError(err?.message || "Failed to update conversation name.");
    } finally {
      setUpdatingName(false);
    }
  };

  const handleDeleteConversation = async () => {
    const confirmed = window.confirm(
      "Delete this conversation? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setLocalError("");

    try {
      await dispatch(deleteConversation(conversation._id)).unwrap();

      onConversationDeleted();
    } catch (err) {
      setLocalError(err?.message || "Failed to delete conversation.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#3A302B] bg-[#171311]/95 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3A302B] px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A89B91]">
              Conversation
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[#F5EEE8]">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3A302B] bg-[#211B18] text-[#A89B91] transition hover:border-[#C65D3B]/50 hover:text-[#F5EEE8]"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Conversation information */}
          <div className="border-b border-[#3A302B]/70 px-5 py-4">
            <div className="rounded-xl border border-[#3A302B] bg-[#211B18]/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#A89B91]">Type</p>

                  <p className="mt-1 text-sm font-medium capitalize text-[#F5EEE8]">
                    {conversation.type}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-[#A89B91]">Members</p>

                  <p className="mt-1 text-sm font-medium text-[#F5EEE8]">
                    {members.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ADD THE GROUP NAME UI HERE */}

          {conversation.type === "group" && (
            <div className="border-b border-[#3A302B]/70 px-5 py-4">
              <div className="rounded-xl border border-[#3A302B] bg-[#211B18]/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A89B91]">
                    Group Name
                  </p>

                  {!editingName && (
                    <button
                      type="button"
                      onClick={() => {
                        setGroupName(conversation.name || "");
                        setEditingName(true);
                        setLocalError("");
                      }}
                      className="rounded-lg border border-[#3A302B] bg-[#211B18] px-3 py-1.5 text-xs font-medium text-[#D87552] transition hover:border-[#C65D3B]/50 hover:bg-[#633326]/20 hover:text-[#F5EEE8]"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      maxLength={100}
                      autoFocus
                      className="min-w-0 flex-1 rounded-xl border border-[#3A302B] bg-[#0F0D0C]/70 px-3 py-2 text-sm text-[#F5EEE8] outline-none placeholder:text-[#A89B91]/60 focus:border-[#C65D3B]"
                    />

                    <button
                      type="button"
                      onClick={handleUpdateConversationName}
                      disabled={updatingName}
                      className="rounded-xl bg-[#C65D3B] px-3 py-2 text-xs font-medium text-[#F5EEE8] transition hover:bg-[#D87552] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingName ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGroupName(conversation.name || "");
                        setEditingName(false);
                        setLocalError("");
                      }}
                      disabled={updatingName}
                      className="rounded-xl border border-[#3A302B] bg-[#211B18] px-3 py-2 text-xs text-[#A89B91] transition hover:border-[#C65D3B]/40 hover:text-[#F5EEE8] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-[#F5EEE8]">
                    {conversation.name || "Group conversation"}
                  </p>
                )}
              </div>
            </div>
          )}
          {/* Add Members */}
          {!isDirect && (
            <div className="border-b border-[#3A302B]/70 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddMembers((value) => !value);
                  setSearch("");
                  setLocalError("");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#3A302B] bg-[#211B18] px-4 py-2.5 text-sm font-medium text-[#C65D3B] transition hover:border-[#C65D3B]/50 hover:bg-[#633326]/20"
              >
                <span className="text-lg">+</span>

                {showAddMembers ? "Close Add Members" : "Add Members"}
              </button>

              {showAddMembers && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setLocalError("");
                    }}
                    placeholder="Search users..."
                    className="w-full rounded-xl border border-[#3A302B] bg-[#0F0D0C]/70 px-4 py-3 text-sm text-[#F5EEE8] outline-none transition placeholder:text-[#A89B91]/60 focus:border-[#C65D3B]/60"
                  />

                  {search.trim() && (
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-[#3A302B] bg-[#211B18]">
                      {searchLoading ? (
                        <p className="px-4 py-3 text-xs text-[#A89B91]">
                          Searching...
                        </p>
                      ) : availableUsers.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-[#A89B91]">
                          No available users found.
                        </p>
                      ) : (
                        availableUsers.map((foundUser) => {
                          const isAdding =
                            String(addingUserId) === String(foundUser._id);

                          return (
                            <button
                              key={foundUser._id}
                              type="button"
                              onClick={() => handleAddMember(foundUser)}
                              disabled={Boolean(addingUserId)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#2C2521] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {foundUser.avatar ? (
                                <img
                                  src={foundUser.avatar}
                                  alt=""
                                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2C2521] text-sm font-semibold text-[#C65D3B]">
                                  {foundUser.name?.charAt(0)?.toUpperCase() ||
                                    "U"}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-[#F5EEE8]">
                                  {foundUser.name || foundUser.username}
                                </p>

                                <p className="truncate text-xs text-[#A89B91]">
                                  @{foundUser.username}
                                </p>
                              </div>

                              {isAdding && (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3A302B] border-t-[#C65D3B]" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {(localError || error) && (
                    <div className="mt-2 rounded-xl border border-[#C65D3B]/30 bg-[#633326]/20 px-3 py-2">
                      <p className="text-xs text-[#D87552]">
                        {localError || error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Members */}
          <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A89B91]">
                Members
              </p>

              {!membersLoading && (
                <span className="text-xs text-[#A89B91]">{members.length}</span>
              )}
            </div>

            {membersLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#3A302B] border-t-[#C65D3B]" />
              </div>
            ) : members.length === 0 ? (
              <div className="rounded-xl border border-[#3A302B] bg-[#211B18]/50 px-4 py-6 text-center">
                <p className="text-sm text-[#F5EEE8]">No members found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const memberUser = member.userId;

                  const name =
                    memberUser?.name || memberUser?.username || "Unknown user";

                  const initial = name?.charAt(0)?.toUpperCase() || "?";

                  return (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 rounded-xl border border-[#3A302B]/70 bg-[#211B18]/50 p-3"
                    >
                      {memberUser?.avatar ? (
                        <img
                          src={memberUser.avatar}
                          alt={name}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2C2521] text-sm font-semibold text-[#C65D3B]">
                          {initial}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#F5EEE8]">
                          {name}
                        </p>

                        {memberUser?.username && (
                          <p className="truncate text-xs text-[#A89B91]">
                            @{memberUser.username}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleChangeRole(member, e.target.value)
                          }
                          disabled={
                            member.role === "admin" || Boolean(addingUserId)
                          }
                          className="rounded-lg border border-[#3A302B] bg-[#211B18] px-2 py-1 text-xs text-[#F5EEE8] outline-none"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>

                        {member.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            disabled={Boolean(addingUserId)}
                            className="rounded-lg border border-[#633326] px-2 py-1 text-xs text-[#D87552] transition hover:bg-[#633326] hover:text-[#F5EEE8] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="border-t border-[#3A302B]/70 px-5 py-4">
            <button
              type="button"
              onClick={handleDeleteConversation}
              className="w-full rounded-xl border border-[#633326] bg-[#211B18] px-4 py-2.5 text-sm font-medium text-[#D87552] transition hover:bg-[#633326]/30 hover:text-[#F5EEE8]"
            >
              Delete Conversation
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#3A302B] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-[#3A302B] bg-[#211B18] px-4 py-2.5 text-sm font-medium text-[#A89B91] transition hover:border-[#C65D3B]/40 hover:text-[#F5EEE8]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConversationDetailsModal;
