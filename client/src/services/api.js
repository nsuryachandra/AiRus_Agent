const RAW_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '') : '';
const API_BASE = `${RAW_BASE}/api`;

function getToken() {
  return localStorage.getItem('airus_auth_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('airus_auth_token', token);
  } else {
    localStorage.removeItem('airus_auth_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Sends cookies across requests
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    let data;
    try {
      data = await res.json();
    } catch (_) {
      data = { success: false, error: `Server error (${res.status})` };
    }

    if (!res.ok) {
      const message = data?.error || data?.message || `Request failed with status ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      // Clear expired token on unauthorized
      setToken(null);
    }
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Auth
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST'
    }),

  getMe: () => request('/auth/me'),

  // Conversations
  listConversations: () => request('/conversations'),

  getConversation: (id) => request(`/conversations/${id}`),

  createConversation: (title) =>
    request('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title })
    }),

  deleteConversation: (id) =>
    request(`/conversations/${id}`, {
      method: 'DELETE'
    }),

  sendMessage: (conversationId, content, options = {}) =>
    request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        verbosity: options.verbosity || options.style || 'natural'
      })
    })
};
