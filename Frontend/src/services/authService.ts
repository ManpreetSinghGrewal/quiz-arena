import { getApiBase } from "../lib/utils";

const getAuthUrl = () => `${getApiBase()}/api/auth`;

const parseResponse = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ...data,
      ok: false,
      message: data.message || `Request failed (${res.status})`,
    };
  }
  return { ...data, ok: true };
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const res = await fetch(`${getAuthUrl()}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return parseResponse(res);
};

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${getAuthUrl()}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse(res);
};

export const getProfile = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const res = await fetch(`${getAuthUrl()}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json();
};

export const requestPasswordReset = async (email: string) => {
  const res = await fetch(`${getAuthUrl()}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseResponse(res);
};

export const resetPasswordWithCode = async (
  email: string,
  code: string,
  newPassword: string
) => {
  const res = await fetch(`${getAuthUrl()}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  });
  return parseResponse(res);
};
