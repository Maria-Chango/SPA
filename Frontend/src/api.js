const API = import.meta.env.VITE_API_URL;

export const getToken = () => localStorage.getItem("token");

async function request(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(API + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    throw new Error(
      typeof detail === "string" ? detail : "Error en la solicitud (" + res.status + ")"
    );
  }
  return data;
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b) => request("POST", p, b),
  put: (p, b) => request("PUT", p, b),
  del: (p) => request("DELETE", p),
};

// Sube un archivo directo a S3 con el formulario prefirmado y devuelve su URL final
export async function uploadFile(kind, file) {
  const p = await api.post(`/uploads/${kind}`, { filename: file.name });
  const form = new FormData();
  Object.entries(p.fields).forEach(([k, v]) => form.append(k, v));
  form.append("file", file); // el archivo debe ir al final
  const res = await fetch(p.url, { method: "POST", body: form });
  if (!res.ok) throw new Error("Falló la subida a S3");
  return p.file_url;
}