(function () {
  'use strict';

  class ApiClient {
    constructor() {
      this._accessToken = null;
      this._refreshInFlight = null;
    }

    setAccessToken(token) {
      this._accessToken = token || null;
    }

    clearAccessToken() {
      this._accessToken = null;
    }

    getAccessToken() {
      return this._accessToken;
    }

    async refreshAccessToken() {
      if (this._refreshInFlight) {
        return this._refreshInFlight;
      }

      this._refreshInFlight = (async () => {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin'
        });

        if (!res.ok) {
          this.clearAccessToken();
          return { ok: false, status: res.status, data: null, errorText: await safeReadText(res) };
        }

        const data = await safeReadJson(res);
        const token = data && data.accessToken ? data.accessToken : null;
        this.setAccessToken(token);

        return { ok: true, status: res.status, data, errorText: null };
      })();

      try {
        return await this._refreshInFlight;
      } finally {
        this._refreshInFlight = null;
      }
    }

    async requestJson(method, url, body) {
      const attempt = async () => {
        const headers = { 'Content-Type': 'application/json' };

        if (this._accessToken && url.startsWith('/api/quantity')) {
          headers['Authorization'] = `Bearer ${this._accessToken}`;
        }

        const res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'same-origin'
        });

        const text = await safeReadText(res);
        const data = tryParseJson(text);

        return {
          ok: res.ok,
          status: res.status,
          data,
          rawText: text
        };
      };

      let response = await attempt();

      // If unauthorized, try refresh once and retry once
      if (response.status === 401 && url.startsWith('/api/quantity')) {
        const refresh = await this.refreshAccessToken();
        if (refresh.ok && this._accessToken) {
          response = await attempt();
        }
      }

      return response;
    }

    async login(login, password) {
      const res = await this.requestJson('POST', '/api/auth/login', { login, password });
      if (!res.ok) return res;

      if (!res.data || !res.data.accessToken) {
        return { ok: false, status: 500, data: null, rawText: 'Login succeeded but no accessToken returned.' };
      }

      this.setAccessToken(res.data.accessToken);
      return res;
    }

    async register(username, email, password) {
      return await this.requestJson('POST', '/api/auth/register', { username, email, password });
    }
  }

  function tryParseJson(text) {
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  async function safeReadText(res) {
    try { return await res.text(); } catch { return ''; }
  }

  async function safeReadJson(res) {
    try { return await res.json(); } catch { return null; }
  }

  window.qm = window.qm || {};
  window.qm.api = new ApiClient();
})();