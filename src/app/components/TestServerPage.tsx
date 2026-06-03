import { useState } from "react";
import { serverUrl } from "../lib/supabase";
import { publicAnonKey } from '../../../utils/supabase/info';

export function TestServerPage() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testHealth = async () => {
    setLoading(true);
    setResult("Testing...");
    try {
      const response = await fetch(`${serverUrl}/health`);
      const text = await response.text();
      setResult(`Health Check Response:\nStatus: ${response.status}\nBody: ${text}`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignup = async () => {
    setLoading(true);
    setResult("Testing signup...");
    try {
      const response = await fetch(`${serverUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'test123',
          name: 'Test User',
          role: 'buyer'
        }),
      });

      const text = await response.text();
      setResult(`Signup Test Response:\nStatus: ${response.status}\nHeaders: ${JSON.stringify([...response.headers.entries()])}\n\nBody: ${text}`);
    } catch (error: any) {
      setResult(`Error: ${error.message}\n${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const testSeeds = async () => {
    setLoading(true);
    setResult("Testing seeds...");
    try {
      const response = await fetch(`${serverUrl}/seeds`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const text = await response.text();
      setResult(`Seeds Test Response:\nStatus: ${response.status}\nBody: ${text}`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Server Test Page</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Server URL</h2>
          <code className="bg-gray-100 p-2 rounded block">{serverUrl}</code>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Tests</h2>
          <div className="space-x-4">
            <button
              onClick={testHealth}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Test Health Endpoint
            </button>
            <button
              onClick={testSignup}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Test Signup Endpoint
            </button>
            <button
              onClick={testSeeds}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Test Seeds Endpoint
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-gray-900 text-green-400 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
