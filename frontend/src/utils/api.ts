const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    throw new Error("Unable to connect to the backend server. Please verify the API is running on http://localhost:8000.");
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/login";
    throw new Error("Session expired. Redirecting to login...");
  }

  if (!response.ok) {
    let errorDetail = "An error occurred";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Fallback if not JSON
    }
    throw new Error(errorDetail);
  }

  // Return text or blob if file download, else parse json
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/pdf") || contentType.includes("text/csv")) {
    return response;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const apiUploadFetch = async (endpoint: string, file: File) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Do NOT set Content-Type, browser will set it with boundary
      },
      body: formData,
    });
  } catch (error) {
    throw new Error("Unable to connect to the backend server. Please check that the backend is running and the API URL is configured correctly.");
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/login";
    throw new Error("Session expired. Redirecting to login...");
  }

  if (!response.ok) {
    let errorDetail = "An error occurred during file upload";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
};
