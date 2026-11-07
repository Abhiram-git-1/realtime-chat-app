const API_URL = import.meta.env.VITE_BACKEND_URL;

const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem("accessToken", token);
  }
};

const clearAccessToken = () => {
  localStorage.removeItem("accessToken");
};

let refreshPromise = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        let data = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok || !data?.accessToken) {
          const error = new Error(
            data?.message || "Session expired",
          );

          error.status = response.status;
          error.data = data;

          throw error;
        }

        setAccessToken(data.accessToken);

        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const request = async (
  endpoint,
  options = {},
  isRetry = false,
) => {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // Access token expired/invalid.
  // Try refreshing only once for this request.
  if (
    response.status === 401 &&
    !isRetry &&
    endpoint !== "/auth/refresh-token"
  ) {
    try {
      const newAccessToken = await refreshAccessToken();

      return request(
        endpoint,
        {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${newAccessToken}`,
          },
        },
        true,
      );
    } catch {
      clearAccessToken();
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || "Something went wrong",
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

export const apiClient = {
  get: (endpoint) =>
    request(endpoint, {
      method: "GET",
    }),

  post: (endpoint, body) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE",
    }),
};