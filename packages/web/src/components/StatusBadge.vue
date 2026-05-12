<script setup lang="ts">
import type { VacationStatus } from '@vacation/shared';
defineProps<{ status: VacationStatus }>();
</script>

<template>
  <span :class="['status', status.toLowerCase()]">{{ status }}</span>
</template>

<style scoped lang="scss">
.status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.4;
}
.pending  { color: var(--status-pending);  background: var(--status-pending-bg); }
.approved { color: var(--status-approved); background: var(--status-approved-bg); }
.rejected { color: var(--status-rejected); background: var(--status-rejected-bg); }
</style>
