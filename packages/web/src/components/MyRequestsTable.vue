<script setup lang="ts">
import { onMounted, ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import StatusBadge from './StatusBadge.vue';
import { vacationsApi } from '@/services/vacationsApi';
import type { VacationRequestDTO } from '@vacation/shared';

const emit = defineEmits<{
  (e: 'row-click', row: VacationRequestDTO): void;
}>();

const items = ref<VacationRequestDTO[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try { items.value = await vacationsApi.listMine(); } finally { loading.value = false; }
}

function onRowClick(e: { data: VacationRequestDTO }) {
  emit('row-click', e.data);
}

defineExpose({ reload: load });
onMounted(load);

function days(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86400000) + 1;
}
</script>

<template>
  <section class="card rise">
    <header class="header">
      <h2 class="title">My requests</h2>
      <p class="subtitle">Most recent first.</p>
    </header>

    <DataTable
      :value="items"
      :loading="loading && items.length === 0"
      :paginator="items.length > 10"
      :rows="10"
      @row-click="onRowClick"
      tableStyle="min-width: 100%"
    >
      <template #empty>
        <div class="empty">
          <i class="pi pi-calendar empty-icon" />
          <p class="empty-title"><em>No journeys planned.</em></p>
          <p class="empty-body">Submit your first vacation request using the form on the left.</p>
        </div>
      </template>
      <Column field="startDate" header="Start" sortable :pt="{ bodyCell: { 'data-label': 'Start' } }">
        <template #body="{ data }">{{ data.startDate }}</template>
      </Column>
      <Column field="endDate" header="End" sortable :pt="{ bodyCell: { 'data-label': 'End' } }">
        <template #body="{ data }">{{ data.endDate }}</template>
      </Column>
      <Column header="Days" :pt="{ bodyCell: { 'data-label': 'Days' } }">
        <template #body="{ data }">{{ days(data.startDate, data.endDate) }}</template>
      </Column>
      <Column field="reason" header="Reason" :pt="{ bodyCell: { 'data-label': 'Reason' } }">
        <template #body="{ data }">
          <span class="reason">{{ data.reason || '—' }}</span>
        </template>
      </Column>
      <Column header="Status" :pt="{ bodyCell: { 'data-label': 'Status' } }">
        <template #body="{ data }"><StatusBadge :status="data.status" /></template>
      </Column>
      <Column field="comments" header="Decision" :pt="{ bodyCell: { 'data-label': 'Decision' } }">
        <template #body="{ data }">
          <span class="comments">{{ data.comments || '—' }}</span>
        </template>
      </Column>
      <Column field="createdAt" header="Submitted" sortable :pt="{ bodyCell: { 'data-label': 'Submitted' } }">
        <template #body="{ data }">{{ new Date(data.createdAt).toLocaleDateString() }}</template>
      </Column>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.card {
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 32px;
  min-width: 0; // prevent grid blowout
}
.header { margin-bottom: 20px; }
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
.reason, .comments {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-secondary);
}
.empty {
  text-align: center;
  padding: 40px 16px;
}
.empty-icon { font-size: 28px; color: var(--ink-muted); }
.empty-title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 20px;
  color: var(--ink-primary);
  margin: 12px 0 4px;
}
.empty-body {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-secondary);
  margin: 0;
}

// PrimeVue DataTable overrides — editorial, no zebra, only horizontal rules
:deep(.p-datatable-table) {
  font-family: var(--font-body);
  font-size: 13px;
  border-collapse: collapse;
  width: 100%;
}
:deep(.p-datatable-thead > tr > th) {
  background: var(--surface-elevated);
  color: var(--ink-secondary);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 12px 12px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  border-left: none;
  border-right: none;
}
// Remove all cell borders except bottom horizontal rule
:deep(.p-datatable-tbody > tr > td) {
  padding: 16px 12px;
  border-bottom: 1px solid var(--border);
  border-top: none;
  border-left: none;
  border-right: none;
  color: var(--ink-primary);
  transition: background 120ms;
}
// No zebra striping — all rows transparent
:deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  cursor: pointer;
}
:deep(.p-datatable-tbody > tr:hover > td) {
  background: var(--surface-elevated);
}
:deep(.p-paginator) {
  background: transparent;
  padding: 16px 0 0;
  justify-content: flex-end;
  font-family: var(--font-body);
  border: none;
}
:deep(.p-paginator .p-paginator-page.p-paginator-page-selected) {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
  border-color: transparent;
}

// Sort indicators
:deep(.p-datatable-sort-icon) {
  color: var(--ink-secondary);
  font-size: 12px;
  margin-left: 6px;
}
:deep(.p-datatable-sortable-column.p-datatable-column-sorted .p-datatable-sort-icon) {
  color: var(--accent);
}

// Suppress loading overlay on populated tables
:deep(.p-datatable-loading-icon) {
  display: none;
}
:deep(.p-datatable-loading-overlay) {
  background: transparent !important;
}

// Mobile card layout — transform table rows into cards below 768px
@media (max-width: 767px) {
  .card { padding: 16px; }
  :deep(.p-datatable) { background: transparent; }
  :deep(.p-datatable-thead) { display: none; }
  :deep(.p-datatable-tbody) { display: block; }
  :deep(.p-datatable-tbody > tr) {
    display: block;
    background: var(--surface-card) !important;
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
  }
  :deep(.p-datatable-tbody > tr > td) {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 6px 0 !important;
    border-bottom: 1px solid var(--border) !important;
    border-left: none !important;
    border-right: none !important;
    border-top: none !important;
    gap: 12px;
  }
  :deep(.p-datatable-tbody > tr > td:last-child) {
    border-bottom: none !important;
    padding-top: 12px !important;
  }
  :deep(.p-datatable-tbody > tr > td::before) {
    content: attr(data-label);
    font-family: var(--font-body);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--ink-secondary);
    flex-shrink: 0;
  }
}
</style>
