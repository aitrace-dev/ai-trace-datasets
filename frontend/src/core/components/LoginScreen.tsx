import React, { useState } from 'react';
import { ENDPOINTS } from '@/config';

const LoginScreen = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      const resp = await fetch(`${ENDPOINTS.AUTH}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      if (!resp.ok) throw new Error("Invalid username or password");
      const data = await resp.json();
      localStorage.setItem("ai_trace_token", data.access_token);
      onLogin(data.access_token);
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col gap-4 border border-blue-100"
        autoComplete="off"
      >
        <h2 className="text-2xl font-bold mb-2 text-blue-700">AI Trace Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          autoFocus
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          autoComplete="current-password"
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded px-4 py-2"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
