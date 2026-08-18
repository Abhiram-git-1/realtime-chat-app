import { useEffect, useState } from "react";

function App() {
    const [message, setMessage] = useState("Connecting...");

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`)            .then((response) => response.json())
            .then((data) => {
                setMessage(data.message);
            })
            .catch(() => {
                setMessage("Backend connection failed");
            });
    }, []);

     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="rounded-xl bg-white p-8 shadow-lg text-center">
                <h1 className="text-3xl font-bold text-gray-900">
                    Realtime Chat App
                </h1>

                <p className="mt-4 text-green-600 font-medium">
                    {message}
                </p>
            </div>
        </div>
    );
}

export default App;