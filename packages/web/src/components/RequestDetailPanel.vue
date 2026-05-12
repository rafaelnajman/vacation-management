<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import { useConfirm } from 'primevue/useconfirm';
import StatusBadge from './StatusBadge.vue';
import RejectModal from './RejectModal.vue';
import { vacationsApi } from '@/services/vacationsApi';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import type { VacationRequestDTO } from '@vacation/shared';

const props = defineProps<{ id: string | null }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const auth = useAuthStore();
const confirm = useConfirm();
const toast = useToast();

const visible = computed({
  get: () => !!props.id,
  set: (v: boolean) => { if (!v) emit('close'); },
});

const data = ref<VacationRequestDTO | null>(null);
const loading = ref(false);
const showRejectModal = ref(false);

async function load(id: string) {
  loading.value = true;
  data.value = null;
  try {
    data.value = await vacationsApi.getById(id);
  } finally {
    loading.value = false;
  }
}

watch(() => props.id, id => {
  if (id) load(id);
}, { immediate: true });

function days(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
}

function fmtRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const y = s.getFullYear();
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return `${fmt.format(s)} – ${fmt.format(e)}, ${y}`;
}

function fmtTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const canDecide = computed(() =>
  auth.role === 'Validator' && data.value?.status === 'Pending'
);

function approve() {
  if (!data.value) return;
  const row = data.value;
  confirm.require({
    message: `Approve request from ${row.user?.name ?? 'this requester'}?`,
    header: 'Confirm approval',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Approve',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await vacationsApi.approve(row.id);
        toast.success('Request approved');
        emit('updated');
        emit('close');
      } catch (e) { toast.apiError(e); }
    },
  });
}

function openReject() { showRejectModal.value = true; }

async function confirmReject(comments: string) {
  if (!data.value) return;
  showRejectModal.value = false;
  try {
    await vacationsApi.reject(data.value.id, { comments });
    toast.success('Request rejected');
    emit('updated');
    emit('close');
  } catch (e) { toast.apiError(e); }
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :pt="{
      root: { class: 'ce-drawer' },
      header: { class: 'ce-drawer-header' },
      content: { class: 'ce-drawer-content' },
      mask: { class: 'ce-drawer-mask' },
    }"
  >
    <template #header>
      <div class="header-band">
        <h2 class="title">
          {{ data?.user?.name ?? 'Request' }}
          <span v-if="data" class="badge"><StatusBadge :status="data.status" /></span>
        </h2>
      </div>
    </template>

    <div v-if="loading" class="loading">Loading…</div>

    <div v-else-if="data" class="body">
      <section class="range">
        <div class="range-text">{{ fmtRange(data.startDate, data.endDate) }}</div>
        <div class="range-meta">{{ days(data.startDate, data.endDate) }} days</div>
      </section>

      <section v-if="data.reason" class="block">
        <div class="lbl">Reason</div>
        <p class="text">{{ data.reason }}</p>
      </section>

      <section v-if="data.comments" :class="['block', 'comment', data.status.toLowerCase()]">
        <div class="lbl">Decision note</div>
        <p class="text">{{ data.comments }}</p>
      </section>

      <section class="timeline">
        <div class="lbl">Timeline</div>
        <div class="event">
          <span class="dot" aria-hidden="true"></span>
          <div>
            <div class="event-lbl">Submitted</div>
            <div class="event-date">{{ fmtTimestamp(data.createdAt) }}</div>
          </div>
        </div>
        <div v-if="data.status !== 'Pending'" class="event">
          <span class="dot" aria-hidden="true"></span>
          <div>
            <div class="event-lbl">{{ data.status === 'Approved' ? 'Approved' : 'Rejected' }}</div>
            <div class="event-date">{{ fmtTimestamp(data.updatedAt) }}</div>
          </div>
        </div>
      </section>

      <footer v-if="canDecide" class="actions">
        <Button label="Reject" :pt="{ root: { class: 'ce-btn-danger' } }" @click="openReject" />
        <Button label="Approve" :pt="{ root: { class: 'ce-btn-pine' } }" @click="approve" />
      </footer>
    </div>

    <RejectModal v-model:visible="showRejectModal" @confirm="confirmReject" />
  </Drawer>
</template>

<style scoped lang="scss">
:deep(.ce-drawer) {
  width: 480px;
  background: var(--surface-card);
  font-family: var(--font-body);
}

@media (max-width: 767px) {
  :deep(.ce-drawer) { width: 100% !important; }
}
:deep(.ce-drawer-header) {
  padding: 0;
  border: none;
  background: var(--ink-primary);
}
:deep(.ce-drawer-content) { padding: 0; }
:deep(.ce-drawer-mask) { background: rgba(10, 14, 20, 0.55); }

.header-band {
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  color: var(--ink-on-inverse);
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 16px;
}
.badge { display: inline-flex; }

.loading {
  padding: 40px 32px;
  font-family: var(--font-display);
  font-style: italic;
  color: var(--ink-secondary);
}

.body {
  padding: 32px;
  display: grid;
  gap: 28px;
}

@media (max-width: 767px) {
  .body { padding: 20px; }
}

.range-text {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--ink-primary);
  line-height: 1.2;
}
.range-meta {
  margin-top: 6px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-secondary);
}

.lbl {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-secondary);
  margin-bottom: 8px;
}
.text {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-primary);
  margin: 0;
  line-height: 1.5;
}

.comment {
  padding-left: 16px;
  border-left: 3px solid var(--border-strong);
}
.comment.rejected { border-left-color: var(--status-rejected); }
.comment.approved { border-left-color: var(--status-approved); }

.timeline { display: grid; gap: 14px; }
.event {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: 12px;
  align-items: flex-start;
}
.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-top: 6px;
  background: var(--ink-primary);
}
.event-lbl {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--ink-primary);
}
.event-date {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-secondary);
  margin-top: 2px;
}

.actions {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

:deep(.ce-btn-pine) {
  background: var(--secondary);
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 120ms;
}
:deep(.ce-btn-pine:hover) { background: #084643; }

:deep(.ce-btn-danger) {
  background: var(--status-rejected);
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
:deep(.ce-btn-danger:hover) { filter: brightness(0.95); }
</style>
