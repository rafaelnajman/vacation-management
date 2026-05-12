<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'confirm', comments: string): void;
}>();

const comments = ref('');
const error = ref('');

watch(
  () => props.visible,
  v => {
    if (v) {
      comments.value = '';
      error.value = '';
    }
  },
);

function close() {
  emit('update:visible', false);
}
function confirm() {
  if (!comments.value.trim()) {
    error.value = 'A reason for rejection is required';
    return;
  }
  emit('confirm', comments.value.trim());
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Reject request"
    :style="{ width: 'min(460px, calc(100vw - 32px))' }"
    :pt="{
      root: { class: 'ce-dialog' },
      header: { class: 'ce-dialog-header' },
      title: { class: 'ce-dialog-title' },
      content: { class: 'ce-dialog-content' },
      mask: { class: 'ce-dialog-mask' },
    }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="body">
      <label class="lbl" for="reject-reason">Reason</label>
      <Textarea
        id="reject-reason"
        v-model="comments"
        rows="4"
        autoResize
        maxlength="2000"
        :pt="{ root: { class: 'ce-input ce-textarea' } }"
      />
      <small class="err" v-if="error">{{ error }}</small>
    </div>

    <template #footer>
      <Button text label="Cancel" @click="close" :pt="{ root: { class: 'ce-btn-ghost' } }" />
      <Button label="Reject" @click="confirm" :pt="{ root: { class: 'ce-btn-danger' } }" />
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
:deep(.ce-dialog) {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--border);
  font-family: var(--font-body);
}
:deep(.ce-dialog-header) {
  padding: 20px 32px;
  border-bottom: none;
  background: var(--ink-primary);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}
:deep(.ce-dialog-title) {
  font-family: var(--font-display) !important;
  font-size: 22px !important;
  font-weight: 400 !important;
  letter-spacing: -0.015em !important;
  color: var(--ink-on-inverse) !important;
}
:deep(.ce-dialog-content) {
  padding: 8px 32px 24px;
}
:deep(.ce-dialog-mask) {
  background: rgba(10, 14, 20, 0.55);
}

.body {
  display: grid;
  gap: 8px;
}
.lbl {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-secondary);
}
.err {
  font-size: 12px;
  color: var(--status-rejected);
}

:deep(.ce-input),
:deep(.ce-input textarea) {
  width: 100%;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-primary);
  transition:
    border-color 120ms,
    box-shadow 120ms;
  outline: none;
}
:deep(.ce-textarea) {
  padding: 0;
}
:deep(.ce-input textarea:focus) {
  border-color: var(--accent);
  box-shadow: var(--ring);
}

// Footer buttons
:deep(.ce-btn-ghost) {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--ink-primary);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
:deep(.ce-btn-ghost:hover) {
  background: var(--surface-elevated);
}

:deep(.ce-btn-danger) {
  background: var(--status-rejected);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  margin-left: 8px;
}
:deep(.ce-btn-danger:hover) {
  filter: brightness(0.95);
}
</style>
