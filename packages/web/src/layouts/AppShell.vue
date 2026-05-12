<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AppSidebar from './AppSidebar.vue';

const auth = useAuthStore();
const initials = computed(() => {
  const name = auth.user?.name ?? '?';
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
});

const drawerOpen = ref(false);
function toggleDrawer() { drawerOpen.value = !drawerOpen.value; }
function closeDrawer() { drawerOpen.value = false; }
</script>

<template>
  <div class="shell">
    <AppSidebar :open="drawerOpen" @close="closeDrawer" />
    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger" @click="toggleDrawer" aria-label="Toggle navigation">
            <i class="pi pi-bars" />
          </button>
          <div class="title">{{ $route.name === 'validator' ? 'All Requests' : 'My Requests' }}</div>
        </div>
        <div class="me">
          <div class="avatar">{{ initials }}</div>
          <div class="who">
            <span class="name">{{ auth.user?.name }}</span>
            <span class="role">{{ auth.user?.role }}</span>
          </div>
        </div>
      </header>
      <section class="content">
        <slot />
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.shell { display: flex; min-height: 100vh; }
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 32px;
  background: var(--surface-card);
  border-bottom: 2px solid var(--rule);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hamburger {
  display: none;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  background: var(--surface-card);
  border-radius: var(--radius-md);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ink-primary);
  font-size: 16px;

  &:hover { background: var(--surface-elevated); }
}

.title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
  color: var(--ink-primary);
  letter-spacing: -0.015em;
}

.me { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
.who {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}
.name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.role {
  font-family: var(--font-body);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-secondary);
}

.content { padding: 32px; flex: 1; }

// Tablet (md)
@media (max-width: 1023px) {
  .topbar { padding: 0 24px; }
  .content { padding: 24px; }
  .title { font-size: 22px; }
}

// Mobile (sm and below)
@media (max-width: 767px) {
  .topbar { padding: 0 16px; height: 56px; }
  .content { padding: 16px; }
  .title { font-size: 18px; }
  .hamburger { display: inline-flex; }
  .who { display: none; }
}

// xs phones
@media (max-width: 479px) {
  .content { padding: 12px; }
}
</style>
