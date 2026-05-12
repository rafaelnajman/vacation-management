<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const auth = useAuthStore();
const router = useRouter();

const items = computed(() => {
  if (auth.role === 'Validator') {
    return [{ label: 'All Requests', icon: 'pi pi-list', to: '/validator' }];
  }
  return [{ label: 'My Requests', icon: 'pi pi-calendar', to: '/requester' }];
});

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}

const todayLabel = computed(() => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).formatToParts(now);
  const month = parts.find(p => p.type === 'month')?.value ?? '';
  const day = parts.find(p => p.type === 'day')?.value ?? '';
  const weekday = parts.find(p => p.type === 'weekday')?.value ?? '';
  return `${month} ${day}, ${weekday}`;
});

function handleNavClick() {
  emit('close');
}
</script>

<template>
  <!-- Mobile backdrop -->
  <div v-if="props.open" class="sidebar-backdrop" @click="emit('close')" />

  <aside :class="['sidebar', { open: props.open }]">
    <button class="close-btn" @click="emit('close')" aria-label="Close navigation">
      <i class="pi pi-times" />
    </button>

    <div class="brand">
      <div class="brand-mark">Vacation<span class="accent">s</span></div>
      <div class="brand-sub">Travelfactory</div>
    </div>

    <nav class="nav" aria-label="Primary">
      <router-link
        v-for="i in items"
        :key="i.to"
        :to="i.to"
        class="nav-item"
        active-class="active"
        @click="handleNavClick"
      >
        <i :class="i.icon" />
        <span>{{ i.label }}</span>
      </router-link>
    </nav>

    <div class="dateline">
      <p class="dateline-date">{{ todayLabel }}</p>
      <div class="dateline-rule"></div>
      <p class="dateline-label">TRAVELFACTORY · INTERNAL</p>
    </div>

    <button class="logout" @click="logout">
      <i class="pi pi-sign-out" />
      <span>Logout</span>
    </button>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  width: 200px;
  background: var(--surface-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.close-btn {
  display: none;
}
.sidebar-backdrop {
  display: none;
}

// Desktop (md+): sticky sidebar
@media (min-width: 768px) {
  .sidebar {
    height: 100vh;
    position: sticky;
    top: 0;
    align-self: flex-start;
    z-index: 5;
  }
}

// Mobile (sm and below): hidden drawer that slides in
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 260px;
    max-width: 80vw;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1);
    z-index: 30;
    box-shadow: 0 12px 32px -16px rgba(15, 30, 44, 0.18);
  }
  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(10, 14, 20, 0.45);
    z-index: 25;
  }

  .close-btn {
    display: flex;
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    color: var(--ink-secondary);
    font-size: 16px;

    &:hover {
      color: var(--ink-primary);
    }
  }
}

.brand {
  padding: 20px 24px 24px;
}
.brand-mark {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 28px;
  letter-spacing: -0.015em;
  color: var(--ink-primary);
  line-height: 1;
}
.brand-sub {
  margin-top: 6px;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.accent {
  color: var(--accent);
}

.nav {
  flex: 1;
  padding: 16px 0;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  font-family: var(--font-body);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-secondary);
  text-decoration: none;
  border-left: 3px solid transparent;
  transition:
    color 120ms,
    background 120ms;

  i {
    font-size: 14px;
  }

  &:hover {
    color: var(--ink-primary);
    background: var(--surface-elevated);
  }
  &.active {
    color: var(--ink-primary);
    font-weight: 700;
    border-left-color: var(--accent);
    background: transparent;
  }
}

.dateline {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}
.dateline-date {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 14px;
  color: var(--ink-secondary);
  margin: 0 0 10px;
}
.dateline-rule {
  width: 32px;
  height: 1px;
  background: var(--border);
  margin-bottom: 8px;
}
.dateline-label {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin: 0;
}

.logout {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  margin: 0;
  border: none;
  background: transparent;
  border-top: 1px solid var(--border);
  font-family: var(--font-body);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-secondary);
  cursor: pointer;
  transition:
    color 120ms,
    background 120ms;

  i {
    font-size: 14px;
  }

  &:hover {
    color: var(--ink-primary);
    background: var(--surface-elevated);
  }
}
</style>
