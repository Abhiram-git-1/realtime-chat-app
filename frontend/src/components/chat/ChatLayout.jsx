import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchConversations,
  fetchMessages,
  clearActiveConversation,
  setActiveConversation,
} from "../../features/chat/chatSlice";

import ConversationSidebar from "./ConversationSidebar";
import MessagePanel from "./MessagePanel";
import NewConversationModal from "./NewConversationModal";

function ChatLayout() {
  const dispatch = useDispatch();

  const {
    conversations,
    activeConversation,
  } = useSelector((state) => state.chat);

  const [showNewConversation, setShowNewConversation] =
    useState(false);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  const handleSelectConversation = async (
    conversation,
  ) => {
    dispatch(
      setActiveConversation(conversation),
    );

    await dispatch(
      fetchMessages(conversation._id),
    ).unwrap();
  };


  const handleConversationCreated = async (
    conversation,
  ) => {
    setShowNewConversation(false);

    /*
     * GET /conversations returns the complete
     * conversation including populated members.
     */
    const result = await dispatch(
      fetchConversations(),
    ).unwrap();

    const updatedConversations =
      result?.conversations ||
      result ||
      [];

    const fullConversation =
      updatedConversations.find(
        (item) =>
          String(item._id) ===
          String(conversation._id),
      ) || conversation;

    dispatch(
      setActiveConversation(fullConversation),
    );

    await dispatch(
      fetchMessages(fullConversation._id),
    ).unwrap();
  };

  return (
    <main className="h-screen overflow-hidden bg-[#0F0D0C] text-[#F5EEE8] sm:p-4">
      <div className="flex h-full overflow-hidden border-[#3A302B]/80 bg-[#171311]/80 shadow-2xl backdrop-blur-xl sm:rounded-2xl sm:border">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={
            activeConversation?._id
          }
          onSelectConversation={
            handleSelectConversation
          }
          onNewConversation={() =>
            setShowNewConversation(true)
          }
          mobileHidden={Boolean(activeConversation)}
        />

        <MessagePanel
          onBack={() => dispatch(clearActiveConversation())}
        />
      </div>

      {showNewConversation && (
        <NewConversationModal
          onClose={() =>
            setShowNewConversation(false)
          }
          onConversationCreated={
            handleConversationCreated
          }
        />
      )}
    </main>
  );
}

export default ChatLayout;
