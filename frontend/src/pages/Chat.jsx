// import { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";

// import {
//   logoutUser,
//   logoutAllUsers,
// } from "../features/auth/authSlice";

// function Chat() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const { user, loading } = useSelector((state) => state.auth);

//   const [action, setAction] = useState(null);

//   const handleLogout = async () => {
//     try {
//       setAction("logout");

//       await dispatch(logoutUser()).unwrap();

//       navigate("/login", { replace: true });
//     } catch {
//       navigate("/login", { replace: true });
//     } finally {
//       setAction(null);
//     }
//   };

//   const handleLogoutAll = async () => {
//     const confirmed = window.confirm(
//       "This will log out your account from all active sessions. Continue?",
//     );

//     if (!confirmed) {
//       return;
//     }

//     try {
//       setAction("logoutAll");

//       await dispatch(logoutAllUsers()).unwrap();

//       navigate("/login", { replace: true });
//     } catch {
//       navigate("/login", { replace: true });
//     } finally {
//       setAction(null);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
//       <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
//         <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold">
//               Chat Application
//             </h1>

//             <p className="mt-2 text-slate-400">
//               Welcome,{" "}
//               <span className="text-white">
//                 {user?.name || user?.username || "User"}
//               </span>
//             </p>
//           </div>

//           <div className="flex flex-wrap gap-3">
//             <button
//               type="button"
//               onClick={() => navigate("/sessions")}
//               className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
//             >
//               Sessions
//             </button>

//             <button
//               type="button"
//               onClick={() => navigate("/change-password")}
//               className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
//             >
//               Change Password
//             </button>

//             <button
//               type="button"
//               onClick={handleLogout}
//               disabled={loading || action !== null}
//               className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               {action === "logout"
//                 ? "Logging out..."
//                 : "Logout"}
//             </button>
//           </div>
//         </header>

//         <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
//           <h2 className="text-xl font-semibold">
//             Realtime Chat
//           </h2>

//           <p className="mt-2 text-slate-400">
//             The main chat interface will be built in the
//             upcoming frontend phases.
//           </p>

//           <div className="mt-8 border-t border-slate-800 pt-6">
//             <h3 className="font-semibold">
//               Account Security
//             </h3>

//             <p className="mt-2 text-sm text-slate-500">
//               Logging out from all devices will revoke every
//               active session associated with your account.
//             </p>

//             <button
//               type="button"
//               onClick={handleLogoutAll}
//               disabled={loading || action !== null}
//               className="mt-5 rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               {action === "logoutAll"
//                 ? "Logging out everywhere..."
//                 : "Logout All Devices"}
//             </button>
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }

// export default Chat;
import ChatLayout from "../components/chat/ChatLayout";

function Chat() {
  return <ChatLayout />;
}

export default Chat;