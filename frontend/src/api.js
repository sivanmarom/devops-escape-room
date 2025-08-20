export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getWelcome() {
  const res = await fetch(`${API_BASE}/api/welcome`);
  if (!res.ok) throw new Error("Failed to fetch /api/welcome");
  return res.json();
}