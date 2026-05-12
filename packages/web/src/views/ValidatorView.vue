<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import AppShell from '@/layouts/AppShell.vue';
import StatsCard from '@/components/StatsCard.vue';
import RequestTable from '@/components/RequestTable.vue';
import RejectModal from '@/components/RejectModal.vue';
import RequestDetailPanel from '@/components/RequestDetailPanel.vue';
import DecisionStamp from '@/components/DecisionStamp.vue';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import { useConfirm } from 'primevue/useconfirm';
import { vacationsApi } from '@/services/vacationsApi';
import { useToast } from '@/composables/useToast';
import type { VacationRequestDTO, VacationStats } from '@vacation/shared';

const toast = useToast();
const confirm = useConfirm();
const tableRef = ref<InstanceType<typeof RequestTable> | null>(null);

const filters = reactive<{
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | null;
  requester: string;
  range: Date[] | null;
}>({ status: null, requester: '', range: null });

const stats = ref<VacationStats>({ pending: 0, approved: 0, rejected: 0 });
const showRejectModal = ref(false);
const rejectTarget = ref<VacationRequestDTO | null>(null);
const detailId = ref<string | null>(null);
const stampDecision = ref<'Approved' | 'Rejected' | null>(null);
const stampVisible = ref(false);

function showStamp(decision: 'Approved' | 'Rejected') {
  stampDecision.value = decision;
  stampVisible.value = true;
  setTimeout(() => { stampVisible.value = false; }, 720);
}

const statusOptions = [
  { label: 'All',       value: null },
  { label: 'Pending',   value: 'Pending' },
  { label: 'Approved',  value: 'Approved' },
  { label: 'Rejected',  value: 'Rejected' },
  { label: 'Cancelled', value: 'Cancelled' },
];

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function loadStats() { stats.value = await vacationsApi.stats(); }

async function loadPage(params: { page: number; pageSize: number }) {
  return vacationsApi.listAll({
    page: params.page,
    pageSize: params.pageSize,
    status: filters.status ?? undefined,
    requester: filters.requester || undefined,
    from: filters.range?.[0] ? fmt(filters.range[0]) : undefined,
    to:   filters.range?.[1] ? fmt(filters.range[1]) : undefined,
  });
}

function applyStatusFromCard(s: 'Pending' | 'Approved' | 'Rejected') {
  filters.status = filters.status === s ? null : s;
}

function clearFilters() {
  filters.status = null;
  filters.requester = '';
  filters.range = null;
}

watch(filters, () => { tableRef.value?.reload(); }, { deep: true });

async function approve(row: VacationRequestDTO) {
  confirm.require({
    message: `Approve ${row.user?.name ?? 'this request'}?`,
    header: 'Confirm approval',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Approve',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await vacationsApi.approve(row.id);
        showStamp('Approved');
        toast.success('Request approved');
        await refresh();
      } catch (e) { toast.apiError(e); }
    },
  });
}

function openReject(row: VacationRequestDTO) {
  rejectTarget.value = row;
  showRejectModal.value = true;
}

async function confirmReject(comments: string) {
  if (!rejectTarget.value) return;
  showRejectModal.value = false;
  try {
    await vacationsApi.reject(rejectTarget.value.id, { comments });
    showStamp('Rejected');
    toast.success('Request rejected');
    await refresh();
  } catch (e) { toast.apiError(e); }
}

async function refresh() {
  await Promise.all([loadStats(), tableRef.value?.reload()]);
}

onMounted(loadStats);
</script>

<template>
  <AppShell>
    <div class="page">
      <div class="stats-row">
        <StatsCard class="rise" label="Pending"  :count="stats.pending"  icon="pi pi-clock"
                   :active="filters.status === 'Pending'"  @click="applyStatusFromCard('Pending')" />
        <StatsCard class="rise" label="Approved" :count="stats.approved" icon="pi pi-check-circle"
                   :active="filters.status === 'Approved'" @click="applyStatusFromCard('Approved')" />
        <StatsCard class="rise" label="Rejected" :count="stats.rejected" icon="pi pi-times-circle"
                   :active="filters.status === 'Rejected'" @click="applyStatusFromCard('Rejected')" />
      </div>

      <section class="filters rise">
        <div class="filter">
          <label class="lbl">Status</label>
          <Select v-model="filters.status" :options="statusOptions"
                  optionLabel="label" optionValue="value" placeholder="All"
                  :pt="{ root: { class: 'ce-select' } }" />
        </div>
        <div class="filter">
          <label class="lbl">Requester</label>
          <InputText v-model="filters.requester" placeholder="Search requester…"
                     :pt="{ root: { class: 'ce-input' } }" />
        </div>
        <div class="filter">
          <label class="lbl">Date range</label>
          <DatePicker v-model="filters.range" selectionMode="range" placeholder="From – to"
                      dateFormat="yy-mm-dd" :pt="{ pcInput: { root: { class: 'ce-input' } } }" />
        </div>
        <Button text label="Clear" icon="pi pi-times" @click="clearFilters"
                :pt="{ root: { class: 'ce-btn-clear' } }" />
      </section>

      <div class="rise">
        <RequestTable ref="tableRef" :load="loadPage"
                      @approve="approve" @reject="openReject"
                      @row-click="(row) => detailId = row.id" />
      </div>

      <RejectModal v-model:visible="showRejectModal" @confirm="confirmReject" />

      <DecisionStamp :visible="stampVisible" :decision="stampDecision" />

      <RequestDetailPanel :id="detailId" @close="detailId = null" @updated="refresh" />

      <footer class="page-footer rise">
        <span class="dot" aria-hidden="true">·</span>
        TRAVELFACTORY
        <span class="dot" aria-hidden="true">·</span>
        INTERNAL
        <span class="dot" aria-hidden="true">·</span>
        VACATION MANAGEMENT
      </footer>
    </div>
  </AppShell>
</template>

<style scoped lang="scss">
.page { display: grid; gap: 24px; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.filters {
  display: grid;
  grid-template-columns: 200px 280px 240px auto;
  gap: 16px;
  align-items: end;
  padding: 20px 24px;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}
.filter { display: grid; gap: 6px; }
.lbl {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-secondary);
}

// Editorial input/select inside filters
:deep(.ce-input),
:deep(.ce-input input) {
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
:deep(.ce-input input:focus),
:deep(.ce-input:focus) { border-color: var(--accent); box-shadow: var(--ring); }

:deep(.ce-select) {
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 14px;
  font-family: var(--font-body);
  font-size: 14px;
  height: 40px;
  display: flex;
  align-items: center;
}
:deep(.ce-select:focus-within) { border-color: var(--accent); box-shadow: var(--ring); outline: none; }

:deep(.ce-btn-clear) {
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-secondary);
  cursor: pointer;
  height: 40px;
}
:deep(.ce-btn-clear:hover) { background: var(--surface-elevated); color: var(--ink-primary); }

.page-footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--ink-muted);
  display: flex;
  gap: 12px;
  align-items: center;
}
.page-footer .dot { font-size: 14px; color: var(--accent); }

@media (max-width: 1023px) {
  .filters {
    grid-template-columns: 1fr 1fr;
    align-items: end;
  }
  .filters :deep(.ce-btn-clear) { grid-column: 2; justify-self: end; }
}

@media (max-width: 767px) {
  .stats-row { grid-template-columns: 1fr; }
  .filters {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  .filters :deep(.ce-btn-clear) { grid-column: 1; justify-self: stretch; }
  .page-footer {
    flex-wrap: wrap;
    font-size: 9px;
    gap: 8px;
  }
}
</style>
