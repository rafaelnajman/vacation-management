<script setup lang="ts">
defineProps<{
  label: string;
  count: number;
  icon: string;
  active: boolean;
}>();
defineEmits<{ (e: 'click'): void }>();
</script>

<template>
  <button :class="['stat', { active }]" type="button" @click="$emit('click')">
    <i :class="['icon', icon]" aria-hidden="true" />
    <div class="number">{{ count }}</div>
    <div class="anchor-bar"></div>
    <div class="label">{{ label }}</div>
  </button>
</template>

<style scoped lang="scss">
.stat {
  position: relative;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-top: 3px solid var(--accent);
  border-radius: var(--radius-card);
  padding: 32px;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-body);
  transition: border-color 120ms, border-top-color 120ms;
  display: block;
  width: 100%;
}

.stat.active {
  border-top: 4px solid var(--accent);
  border-bottom-color: var(--border-strong);
}

.stat:hover { border-color: var(--border-strong); border-top-color: var(--accent); }
.stat:focus-visible { outline: none; box-shadow: var(--ring); }

.icon {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--ink-muted);
  font-size: 16px;
  transition: color 120ms;
}

.stat.active .icon {
  color: var(--accent);
}

.number {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 64px;
  line-height: 1.0;
  color: var(--ink-primary);
  letter-spacing: -0.015em;
}

.anchor-bar {
  width: 24px;
  height: 3px;
  background: var(--ink-primary);
  margin-top: 12px;
}

.label {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-secondary);
  margin-top: 8px;
}

.stat::after {
  content: "";
  position: absolute;
  top: 8px;
  left: 8px;
  width: 8px;
  height: 8px;
  border-top: 2px solid var(--ink-muted);
  border-left: 2px solid var(--ink-muted);
  opacity: 0.25;
  pointer-events: none;
}

@media (max-width: 767px) {
  .stat { padding: 24px; }
  .number { font-size: 44px; }
}
</style>
