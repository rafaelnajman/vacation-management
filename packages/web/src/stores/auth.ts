import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { LoginDTO, RegisterDTO, SafeUser } from '@vacation/shared';
import { authApi } from '@/services/authApi';

const STORAGE_KEY = 'vacation-auth';

interface StoredAuth {
  user: SafeUser;
  token: string;
}

function readStored(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<SafeUser | null>(null);
  const token = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const role = computed(() => user.value?.role);

  function persist() {
    if (user.value && token.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: user.value, token: token.value }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function login(dto: LoginDTO) {
    const res = await authApi.login(dto);
    user.value = res.user;
    token.value = res.token;
    persist();
  }

  async function register(dto: RegisterDTO) {
    const res = await authApi.register(dto);
    user.value = res.user;
    token.value = res.token;
    persist();
  }

  function logout() {
    user.value = null;
    token.value = null;
    persist();
  }

  async function restore() {
    const stored = readStored();
    if (!stored) return;
    token.value = stored.token;
    user.value = stored.user;
    try {
      const fresh = await authApi.me();
      user.value = fresh;
      persist();
    } catch {
      logout();
    }
  }

  return { user, token, isAuthenticated, role, login, register, logout, restore };
});
