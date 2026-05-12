<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import DatePicker from 'primevue/datepicker';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { vacationsApi } from '@/services/vacationsApi';
import { useToast } from '@/composables/useToast';
import { updateVacationSchema, type VacationRequestDTO } from '@vacation/shared';

const props = defineProps<{
  visible: boolean;
  request: VacationRequestDTO | null;
}>();
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'updated'): void;
}>();

const toast = useToast();

const form = reactive<{ range: Date[] | null; reason: string }>({ range: null, reason: '' });
const errors = ref<Record<string, string[]>>({});
const submitting = ref(false);

// Pre-fill on open
watch(
  () => props.visible,
  v => {
    if (v && props.request) {
      form.range = [new Date(props.request.startDate), new Date(props.request.endDate)];
      form.reason = props.request.reason ?? '';
      errors.value = {};
    }
  },
);

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function close() {
  emit('update:visible', false);
}

async function submit() {
  if (!props.request) return;
  errors.value = {};
  if (!form.range || form.range.length !== 2 || !form.range[0] || !form.range[1]) {
    errors.value = { range: ['Please pick start and end dates'] };
    return;
  }
  const payload = {
    startDate: fmt(form.range[0]),
    endDate: fmt(form.range[1]),
    reason: form.reason || undefined,
  };
  const parsed = updateVacationSchema.safeParse(payload);
  if (!parsed.success) {
    errors.value = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return;
  }
  submitting.value = true;
  try {
    await vacationsApi.update(props.request.id, parsed.data);
    toast.success('Request updated');
    emit('updated');
    emit('update:visible', false);
  } catch (e) {
    toast.apiError(e, 'Could not update your request');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Edit request"
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
    <form @submit.prevent="submit" class="form">
      <div class="field">
        <label class="lbl">Dates</label>
        <DatePicker
          v-model="form.range"
          selectionMode="range"
          :minDate="new Date()"
          dateFormat="yy-mm-dd"
          :manualInput="false"
          showIcon
          :pt="{ pcInput: { root: { class: 'ce-input' } } }"
        />
        <small class="err" v-if="errors.range">{{ errors.range[0] }}</small>
        <small class="err" v-if="errors.endDate">{{ errors.endDate[0] }}</small>
      </div>

      <div class="field">
        <label class="lbl">Reason (optional)</label>
        <Textarea
          v-model="form.reason"
          rows="3"
          autoResize
          maxlength="1000"
          :pt="{ root: { class: 'ce-input ce-textarea' } }"
        />
        <small class="err" v-if="errors.reason">{{ errors.reason[0] }}</small>
      </div>
    </form>

    <template #footer>
      <Button text label="Cancel" @click="close" :pt="{ root: { class: 'ce-btn-ghost' } }" />
      <Button
        label="Save changes"
        @click="submit"
        :loading="submitting"
        :pt="{ root: { class: 'ce-btn-primary' } }"
      />
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
  border-bottom: 1px solid var(--border);
  background: var(--surface-card);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}
:deep(.ce-dialog-title) {
  font-family: var(--font-display) !important;
  font-size: 22px !important;
  font-weight: 400 !important;
  letter-spacing: -0.015em !important;
  color: var(--ink-primary) !important;
}
:deep(.ce-dialog-content) {
  padding: 8px 32px 24px;
}
:deep(.ce-dialog-mask) {
  background: rgba(10, 14, 20, 0.55);
}

.form {
  display: grid;
  gap: 16px;
  padding-top: 16px;
}
.field {
  display: grid;
  gap: 6px;
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
:deep(.ce-input input),
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
:deep(.ce-input:focus-within),
:deep(.ce-input input:focus),
:deep(.ce-input textarea:focus) {
  border-color: var(--accent);
  box-shadow: var(--ring);
}

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

:deep(.ce-btn-primary) {
  background: var(--accent);
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
:deep(.ce-btn-primary:hover) {
  background: var(--accent-hover);
}
</style>
