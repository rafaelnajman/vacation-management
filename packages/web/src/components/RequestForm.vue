<script setup lang="ts">
import { reactive, ref } from 'vue';
import DatePicker from 'primevue/datepicker';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { vacationsApi } from '@/services/vacationsApi';
import { useToast } from '@/composables/useToast';
import { createVacationSchema } from '@vacation/shared';

const emit = defineEmits<{ (e: 'created'): void }>();
const toast = useToast();

const form = reactive<{ range: Date[] | null; reason: string }>({ range: null, reason: '' });
const errors = ref<Record<string, string[]>>({});
const submitting = ref(false);

function fmt(d: Date) {
  // YYYY-MM-DD in local time (avoid UTC shift)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function submit() {
  errors.value = {};
  if (!form.range || form.range.length !== 2 || !form.range[0] || !form.range[1]) {
    errors.value = { range: ['Please pick start and end dates'] };
    return;
  }
  const payload = {
    startDate: fmt(form.range[0]),
    endDate:   fmt(form.range[1]),
    reason:    form.reason || undefined,
  };
  const parsed = createVacationSchema.safeParse(payload);
  if (!parsed.success) {
    errors.value = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return;
  }
  submitting.value = true;
  try {
    await vacationsApi.create(parsed.data);
    toast.success('Request submitted');
    form.range = null; form.reason = '';
    emit('created');
  } catch (e) {
    toast.apiError(e, 'Could not submit your request');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="card rise">
    <header class="header">
      <h2 class="title">New request</h2>
      <p class="subtitle">Select your dates.</p>
    </header>

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
          :inputClass="'ce-input'"
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
          class="ce-input ce-textarea"
        />
        <small class="err" v-if="errors.reason">{{ errors.reason[0] }}</small>
      </div>

      <Button
        type="submit"
        :loading="submitting"
        label="Submit request"
        :pt="{ root: { class: 'ce-btn-pine' } }"
      />
    </form>
  </section>
</template>

<style scoped lang="scss">
.card {
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 32px;
}
.header { margin-bottom: 24px; }
.title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--ink-primary);
}
.subtitle {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 14px;
  color: var(--ink-secondary);
  margin: 4px 0 0;
}

.form { display: grid; gap: 16px; }
.field { display: grid; gap: 6px; }
.lbl {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-secondary);
}
.err {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--status-rejected);
}

// Editorial input style applied via :inputClass and direct class
:deep(.ce-input) {
  width: 100%;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-primary);
  transition: border-color 120ms, box-shadow 120ms;
  outline: none;
}
:deep(.ce-textarea) {
  display: block;
  resize: vertical;
}
:deep(.ce-input:focus),
:deep(.ce-textarea:focus) {
  border-color: var(--accent);
  box-shadow: var(--ring);
}

// DatePicker panel inherits editorial feel
:deep(.p-datepicker-input) {
  width: 100%;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-primary);
  transition: border-color 120ms, box-shadow 120ms;
  outline: none;
}
:deep(.p-datepicker-input:focus) {
  border-color: var(--accent);
  box-shadow: var(--ring);
}

// button — forest green CTA
:deep(.ce-btn-pine) {
  background: var(--secondary);
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.01em;
  transition: background 120ms, transform 120ms, box-shadow 120ms;
  cursor: pointer;
  width: 100%;
  justify-content: center;
}
:deep(.ce-btn-pine:hover:not(:disabled)) {
  background: #084643;
  transform: translateY(-1px);
}
:deep(.ce-btn-pine:active) { transform: none; }
:deep(.ce-btn-pine:focus-visible) { box-shadow: var(--ring); outline: none; }

@media (max-width: 767px) {
  .card { padding: 20px; }
}
</style>
