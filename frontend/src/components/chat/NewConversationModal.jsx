import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createConversation,
  searchUsers,
} from "../../features/chat/chatSlice";

function NewConversationModal({
  onClose,
  onConversationCreated,
}) {
  const dispatch = useDispatch();

  const user = useSelector(
    (state) => state.auth.user,
  );

  const {
    searchUsers: users,
    searchLoading,
    error,
  } = useSelector((state) => state.chat);

  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMembers, setSelectedMembers] =
    useState([]);
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState("");

  /*
   * Search users with debounce.
   */
  useEffect(() => {
    const query = search.trim();

    if (!query) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch(searchUsers(query));
    }, 300);

    return () => clearTimeout(timer);
  }, [dispatch, search]);

  /*
   * Add/remove selected group member.
   */
  const handleToggleMember = (foundUser) => {
    setLocalError("");

    const alreadySelected =
      selectedMembers.some(
        (member) =>
          String(member._id) ===
          String(foundUser._id),
      );

    if (alreadySelected) {
      setSelectedMembers((current) =>
        current.filter(
          (member) =>
            String(member._id) !==
            String(foundUser._id),
        ),
      );

      return;
    }

    setSelectedMembers((current) => [
      ...current,
      foundUser,
    ]);

    setSearch("");
  };

  /*
   * Remove selected member.
   */
  const handleRemoveMember = (userId) => {
    setSelectedMembers((current) =>
      current.filter(
        (member) =>
          String(member._id) !==
          String(userId),
      ),
    );
  };

  /*
   * Create group conversation.
   */
  const handleCreateGroup = async () => {
    setLocalError("");

    const trimmedName = groupName.trim();

    if (!trimmedName) {
      setLocalError(
        "Please enter a group name.",
      );
      return;
    }

    if (selectedMembers.length === 0) {
      setLocalError(
        "Select at least one member.",
      );
      return;
    }

    try {
      setCreating(true);

      const result = await dispatch(
        createConversation({
          type: "group",
          name: trimmedName,
          memberIds: selectedMembers.map(
            (member) => member._id,
          ),
        }),
      ).unwrap();

      const conversation =
        result?.conversation || result;

      if (!conversation?._id) {
        setLocalError(
          "Group was created but no conversation was returned.",
        );
        return;
      }

      await onConversationCreated(
        conversation,
      );
    } catch (err) {
      setLocalError(
        err?.message ||
          error ||
          "Failed to create group.",
      );
    } finally {
      setCreating(false);
    }
  };

  /*
   * Close when clicking backdrop.
   */
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#3A302B] bg-[#171311]/95 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3A302B] px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A89B91]">
              New Conversation
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[#F5EEE8]">
              Create Group
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3A302B] bg-[#211B18] text-[#A89B91] transition hover:border-[#C65D3B]/50 hover:text-[#F5EEE8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">
          {/* Group name */}
          <div>
            <label
              htmlFor="group-name"
              className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-[#A89B91]"
            >
              Group Name
            </label>

            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(event) => {
                setGroupName(event.target.value);
                setLocalError("");
              }}
              placeholder="e.g. Project Team"
              maxLength={100}
              disabled={creating}
              className="w-full rounded-xl border border-[#3A302B] bg-[#0F0D0C]/70 px-4 py-3 text-sm text-[#F5EEE8] outline-none transition placeholder:text-[#A89B91]/60 focus:border-[#C65D3B]/60"
            />
          </div>

          {/* Selected members */}
          {selectedMembers.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-[#A89B91]">
                Selected Members
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(
                  (member) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-2 rounded-full border border-[#C65D3B]/30 bg-[#633326]/40 px-3 py-1.5"
                    >
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C65D3B] text-[10px] font-semibold text-[#F5EEE8]">
                          {member.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "U"}
                        </div>
                      )}

                      <span className="max-w-[140px] truncate text-xs text-[#F5EEE8]">
                        {member.name ||
                          member.username}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMember(
                            member._id,
                          )
                        }
                        disabled={creating}
                        className="text-xs text-[#A89B91] transition hover:text-[#F5EEE8]"
                      >
                        ✕
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Search users */}
          <div>
            <label
              htmlFor="group-member-search"
              className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-[#A89B91]"
            >
              Add Members
            </label>

            <input
              id="group-member-search"
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setLocalError("");
              }}
              placeholder="Search by name or username..."
              disabled={creating}
              className="w-full rounded-xl border border-[#3A302B] bg-[#0F0D0C]/70 px-4 py-3 text-sm text-[#F5EEE8] outline-none transition placeholder:text-[#A89B91]/60 focus:border-[#C65D3B]/60"
            />

            {/* Search results */}
            {search.trim() && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#3A302B] bg-[#211B18]">
                {searchLoading ? (
                  <p className="px-4 py-3 text-xs text-[#A89B91]">
                    Searching...
                  </p>
                ) : users.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-[#A89B91]">
                    No users found.
                  </p>
                ) : (
                  users.map((foundUser) => {
                    const isCurrentUser =
                      String(foundUser._id) ===
                      String(user?.id);

                    const isSelected =
                      selectedMembers.some(
                        (member) =>
                          String(member._id) ===
                          String(
                            foundUser._id,
                          ),
                      );

                    return (
                      <button
                        key={foundUser._id}
                        type="button"
                        disabled={
                          isCurrentUser ||
                          isSelected ||
                          creating
                        }
                        onClick={() =>
                          handleToggleMember(
                            foundUser,
                          )
                        }
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#2C2521] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {foundUser.avatar ? (
                          <img
                            src={foundUser.avatar}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2C2521] text-sm font-semibold text-[#C65D3B]">
                            {foundUser.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "U"}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#F5EEE8]">
                            {foundUser.name ||
                              foundUser.username}
                          </p>

                          <p className="truncate text-xs text-[#A89B91]">
                            @{foundUser.username}
                          </p>
                        </div>

                        {isSelected && (
                          <span className="text-sm text-[#78C091]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {(localError || error) && (
            <div className="rounded-xl border border-[#C65D3B]/30 bg-[#633326]/20 px-4 py-3">
              <p className="text-xs leading-5 text-[#D87552]">
                {localError || error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#3A302B] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-xl border border-[#3A302B] bg-[#211B18] px-4 py-2.5 text-sm font-medium text-[#A89B91] transition hover:border-[#A89B91]/40 hover:text-[#F5EEE8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={
              creating ||
              !groupName.trim() ||
              selectedMembers.length === 0
            }
            className="rounded-xl bg-[#C65D3B] px-5 py-2.5 text-sm font-semibold text-[#F5EEE8] transition hover:bg-[#D87552] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating
              ? "Creating..."
              : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewConversationModal;