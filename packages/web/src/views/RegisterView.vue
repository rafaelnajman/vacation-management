<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Select from 'primevue/select';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { registerSchema } from '@vacation/shared';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();

const roleOptions = [
  { label: 'Requester (employee)', value: 'Requester' },
  { label: 'Validator (manager)',  value: 'Validator' },
];

const form = reactive({ name: '', email: '', password: '', role: '' });
const errors = ref<Record<string, string[]>>({});
const submitting = ref(false);

async function submit() {
  errors.value = {};
  const parsed = registerSchema.safeParse(form);
  if (!parsed.success) {
    errors.value = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return;
  }
  submitting.value = true;
  try {
    await auth.register(parsed.data);
    const destination = auth.role === 'Validator' ? '/validator' : '/requester';
    await router.push(destination);
  } catch (e) {
    toast.apiError(e, 'Registration failed');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="register-page">
    <article class="card rise" aria-label="Create account form">
      <header class="header">
        <h2 class="title">Create account</h2>
        <p class="subtitle">Join in seconds.</p>
      </header>

      <form @submit.prevent="submit" class="form" novalidate>
        <div class="field">
          <label class="lbl" for="name">Full name</label>
          <InputText
            id="name"
            v-model="form.name"
            type="text"
            autocomplete="name"
            :invalid="!!errors.name"
            :pt="{ root: { class: 'ce-input' } }"
          />
          <small class="err" v-if="errors.name">{{ errors.name[0] }}</small>
        </div>

        <div class="field">
          <label class="lbl" for="email">Email</label>
          <InputText
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            :invalid="!!errors.email"
            :pt="{ root: { class: 'ce-input' } }"
          />
          <small class="err" v-if="errors.email">{{ errors.email[0] }}</small>
        </div>

        <div class="field">
          <label class="lbl" for="password">Password</label>
          <Password
            id="password"
            v-model="form.password"
            :feedback="false"
            autocomplete="new-password"
            toggleMask
            :invalid="!!errors.password"
            :inputProps="{ class: 'ce-input', id: 'password' }"
            :pt="{
              root: { class: 'ce-password-root' },
              input: { class: 'ce-input' }
            }"
          />
          <small class="err" v-if="errors.password">{{ errors.password[0] }}</small>
        </div>

        <div class="field">
          <label class="lbl" for="role">Role</label>
          <Select
            v-model="form.role"
            inputId="role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Choose your role…"
            :invalid="!!errors.role"
            :pt="{
              root: { class: 'ce-select' },
              label: { class: 'ce-select-label' }
            }"
          />
          <small class="err" v-if="errors.role">{{ errors.role[0] }}</small>
        </div>

        <Button
          type="submit"
          label="Create account"
          :loading="submitting"
          :pt="{ root: { class: 'ce-btn-primary' } }"
        />
      </form>

      <p class="alt">
        Already have an account?
        <router-link :to="{ name: 'login' }">Sign in</router-link>
      </p>
    </article>
  </main>
</template>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.card {
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 32px;
  width: 100%;
  max-width: 420px;
}

.header {
  margin-bottom: 24px;
}

.title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--ink-primary);
}

.subtitle {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 15px;
  color: var(--ink-secondary);
  margin: 4px 0 0;
}

.form {
  display: grid;
  gap: 16px;
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
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--status-rejected);
}

// PrimeVue InputText override
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
  box-shadow: none;
}

:deep(.ce-input:focus) {
  border-color: var(--accent);
  box-shadow: var(--ring);
}

:deep([data-p-invalid='true'] .ce-input),
:deep(.ce-input[data-p-invalid='true']),
:deep(.ce-input.p-invalid) {
  border-color: var(--status-rejected);
}

// Password wrapper
:deep(.ce-password-root) {
  display: block;
  width: 100%;
}

:deep(.ce-password-root .p-password-input) {
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
  box-shadow: none;
}

:deep(.ce-password-root .p-password-input:focus) {
  border-color: var(--accent);
  box-shadow: var(--ring);
}

:deep(.ce-password-root[data-p-invalid='true'] .p-password-input) {
  border-color: var(--status-rejected);
}

:deep(.ce-password-root .p-password-toggle-button) {
  color: var(--ink-secondary);
}

// PrimeVue Select override
:deep(.ce-select) {
  width: 100%;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-primary);
  transition: border-color 120ms, box-shadow 120ms;
  box-shadow: none;
}

:deep(.ce-select.p-focus),
:deep(.ce-select:focus-within) {
  border-color: var(--accent);
  box-shadow: var(--ring);
  outline: none;
}

:deep(.ce-select[data-p-invalid='true']),
:deep(.ce-select.p-invalid) {
  border-color: var(--status-rejected);
}

:deep(.ce-select .p-select-label),
:deep(.ce-select-label) {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-primary);
  padding: 10px 14px;
}

:deep(.ce-select .p-select-label.p-placeholder) {
  color: var(--ink-muted);
}

:deep(.ce-select .p-select-dropdown) {
  color: var(--ink-secondary);
  padding-right: 10px;
}

:deep(.p-select-overlay .p-select-option) {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-primary);
  padding: 10px 14px;
}

:deep(.p-select-overlay .p-select-option:hover),
:deep(.p-select-overlay .p-select-option.p-focus) {
  background: var(--surface-elevated);
}

:deep(.p-select-overlay .p-select-option[aria-selected='true']) {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

// PrimeVue Button override
:deep(.ce-btn-primary) {
  width: 100%;
  background: var(--accent);
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 120ms, transform 120ms, box-shadow 120ms;
  justify-content: center;
}

:deep(.ce-btn-primary:hover) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

:deep(.ce-btn-primary:active) {
  transform: none;
  background: var(--accent-hover);
}

:deep(.ce-btn-primary:focus-visible) {
  outline: none;
  box-shadow: var(--ring);
}

.alt {
  margin-top: 20px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-secondary);
}

.alt a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 600;
}

@media (max-width: 767px) {
  .register-page { padding: 16px; align-items: flex-start; padding-top: 24px; }
  .card { max-width: 100%; padding: 24px; }
}
</style>
