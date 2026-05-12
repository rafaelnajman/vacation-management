<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { loginSchema } from '@vacation/shared';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const form = reactive({ email: '', password: '' });
const errors = ref<Record<string, string[]>>({});
const submitting = ref(false);

async function submit() {
  errors.value = {};
  const parsed = loginSchema.safeParse(form);
  if (!parsed.success) {
    errors.value = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return;
  }
  submitting.value = true;
  try {
    await auth.login(parsed.data);
    const fallback = auth.role === 'Validator' ? '/validator' : '/requester';
    const redirect = (route.query.redirect as string) || fallback;
    await router.push(redirect);
  } catch (e) {
    toast.apiError(e, 'Login failed');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="login-layout">
    <!-- Left panel: brand identity -->
    <div class="left-panel" aria-hidden="true">
      <p class="micro-label">TRAVELFACTORY · INTERNAL</p>

      <div class="wordmark" role="img" aria-label="Vacations">
        <span class="wm-letter" style="animation-delay: 0ms">V</span>
        <span class="wm-letter" style="animation-delay: 60ms">a</span>
        <span class="wm-letter" style="animation-delay: 120ms">c</span>
        <span class="wm-letter" style="animation-delay: 180ms">a</span>
        <span class="wm-letter" style="animation-delay: 240ms">t</span>
        <span class="wm-letter" style="animation-delay: 300ms">i</span>
        <span class="wm-letter" style="animation-delay: 360ms">o</span>
        <span class="wm-letter" style="animation-delay: 420ms">n</span>
        <span class="wm-letter wm-accent" style="animation-delay: 540ms">s</span>
      </div>

      <div class="left-rule"></div>
      <p class="ops-label">HUMAN RESOURCES</p>
      <p class="tagline"><em>Plan your time off.</em></p>
    </div>

    <!-- Right panel: form -->
    <main class="right-panel">
      <article class="card rise" aria-label="Sign in form">
        <header class="header">
          <h2 class="title">Sign in</h2>
          <p class="subtitle">Welcome back.</p>
        </header>

        <form @submit.prevent="submit" class="form" novalidate>
          <div class="field">
            <label class="lbl" for="email">Email</label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="username"
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
              autocomplete="current-password"
              toggleMask
              :invalid="!!errors.password"
              :inputProps="{ class: 'ce-input', id: 'password' }"
              :pt="{
                root: { class: 'ce-password-root' },
                input: { class: 'ce-input' },
              }"
            />
            <small class="err" v-if="errors.password">{{ errors.password[0] }}</small>
          </div>

          <Button
            type="submit"
            label="Sign in"
            :loading="submitting"
            :pt="{ root: { class: 'ce-btn-primary' } }"
          />
        </form>

        <section class="demo">
          <p class="demo-lbl">Demo users</p>
          <p class="demo-line">alice@example.com / Requester123!</p>
          <p class="demo-line">bob@example.com / Validator123!</p>
        </section>

        <p class="alt">
          New here?
          <router-link :to="{ name: 'register' }">Create an account</router-link>
        </p>
      </article>
    </main>
  </div>
</template>

<style scoped lang="scss">
/* ── Layout ─────────────────────────────────────────────── */
.login-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

@media (max-width: 1023px) and (min-width: 768px) {
  .login-layout {
    grid-template-columns: 2fr 3fr;
  }
  .left-panel {
    padding: 32px;
  }
}

/* ── Left panel ─────────────────────────────────────────── */
.left-panel {
  background: var(--surface-inverse);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 48px;
  position: relative;
}

.micro-label {
  position: absolute;
  top: 40px;
  left: 40px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-on-inverse);
  opacity: 0.5;
  margin: 0;
}

.wordmark {
  display: flex;
  align-items: baseline;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 88px;
  color: var(--ink-on-inverse);
  letter-spacing: -0.015em;
  line-height: 1;
}

.wm-letter {
  display: inline-block;
  opacity: 0;
  transform: translateY(20px);
  animation: wm-fade-up 540ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}

.wm-accent {
  color: var(--accent);
}

@keyframes wm-fade-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wm-letter {
    animation: none !important;
    opacity: 1;
    transform: none;
  }
}

.left-rule {
  width: 60px;
  height: 1px;
  background: rgba(245, 242, 235, 0.2);
  margin: 28px auto 16px;
}

.ops-label {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-on-inverse);
  opacity: 0.6;
  margin: 0 0 14px;
  text-align: center;
}

.tagline {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 16px;
  color: var(--ink-on-inverse);
  opacity: 0.7;
  margin: 0;
  text-align: center;
}

/* ── Right panel ────────────────────────────────────────── */
.right-panel {
  background: var(--surface-page);
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
  font-weight: 400;
  letter-spacing: -0.015em;
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
  transition:
    border-color 120ms,
    box-shadow 120ms;
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

// Password wrapper: make it behave like a block
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
  transition:
    border-color 120ms,
    box-shadow 120ms;
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
  transition:
    background 120ms,
    transform 120ms,
    box-shadow 120ms;
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

.demo {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.demo-lbl {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin: 0 0 8px;
}

.demo-line {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--ink-secondary);
  margin: 2px 0;
}

.alt {
  margin-top: 16px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-secondary);
}

.alt a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* ── Tablet md (768–1023px): reduce wordmark size ──────── */
@media (max-width: 1023px) {
  .wordmark {
    font-size: 64px;
  }
}

/* ── Mobile (<768px) ────────────────────────────────────── */
@media (max-width: 767px) {
  .login-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 160px 1fr;
    min-height: 100vh;
  }

  .left-panel {
    padding: 24px;
    align-items: flex-start;
    justify-content: center;
  }

  .micro-label {
    position: absolute;
    top: 16px;
    left: 16px;
    font-size: 9px;
  }

  .wordmark {
    font-size: 44px;
  }
  .ops-label {
    display: none;
  }
  .left-rule {
    display: none;
  }

  .tagline {
    font-size: 13px;
    opacity: 0.6;
  }

  .right-panel {
    padding: 16px;
    align-items: flex-start;
    padding-top: 24px;
  }

  .card {
    max-width: 100%;
    padding: 24px;
  }
}

/* ── xs phones (<480px) ─────────────────────────────────── */
@media (max-width: 479px) {
  .login-layout {
    grid-template-rows: 140px 1fr;
  }
  .wordmark {
    font-size: 36px;
  }
}
</style>
