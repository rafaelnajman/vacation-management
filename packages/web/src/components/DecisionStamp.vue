<script setup lang="ts">
defineProps<{
  visible: boolean;
  decision: 'Approved' | 'Rejected' | null;
}>();
</script>

<template>
  <transition name="stamp">
    <div
      v-if="visible && decision"
      :class="['stamp-overlay', decision.toLowerCase()]"
      aria-hidden="true"
    >
      <div class="stamp">
        <div class="stamp-rule" />
        <div class="stamp-text">{{ decision === 'Approved' ? 'APPROVED' : 'REJECTED' }}</div>
        <div class="stamp-rule" />
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.stamp-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 1000;
  pointer-events: none;
}

.stamp {
  --stamp-rotation: -4deg;
  display: grid;
  gap: 14px;
  padding: 24px 42px;
  border: 6px solid currentColor;
  transform: rotate(var(--stamp-rotation)) scale(1);
  font-family: var(--font-display);
  font-size: 88px;
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 1;
  background: transparent;
}

.approved {
  color: var(--status-approved);
}

.rejected {
  color: var(--status-rejected);

  .stamp {
    --stamp-rotation: 4deg;
  }
}

.stamp-rule {
  height: 4px;
  background: currentColor;
  width: 100%;
}

.stamp-text {
  padding: 0 8px;
  text-align: center;
}

// Overlay fade
.stamp-enter-active {
  animation: stamp-fade-in 280ms cubic-bezier(0.2, 1.6, 0.2, 1) forwards;
}
.stamp-leave-active {
  animation: stamp-fade-out 320ms ease-in forwards;
}
.stamp-enter-from,
.stamp-leave-to {
  opacity: 0;
}

@keyframes stamp-fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes stamp-fade-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

// Stamp punch animation
.stamp-enter-active .stamp {
  animation: stamp-punch 280ms cubic-bezier(0.2, 1.6, 0.2, 1) forwards;
}

@keyframes stamp-punch {
  0% {
    transform: rotate(0deg) scale(0.4);
  }
  100% {
    transform: rotate(var(--stamp-rotation)) scale(1);
  }
}

// Respect reduced motion
@media (prefers-reduced-motion: reduce) {
  .stamp-enter-active,
  .stamp-leave-active,
  .stamp-enter-active .stamp {
    animation: none !important;
  }
}

// Mobile: smaller stamp
@media (max-width: 767px) {
  .stamp {
    font-size: 56px;
    padding: 16px 24px;
    border-width: 4px;
  }
  .stamp-rule {
    height: 3px;
  }
}
</style>
