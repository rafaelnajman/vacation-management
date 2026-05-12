<script setup lang="ts">
import { ref } from 'vue';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import StatusBadge from './StatusBadge.vue';
import type { VacationRequestDTO, PaginatedVacations } from '@vacation/shared';

const props = defineProps<{
  load: (params: { page: number; pageSize: number }) => Promise<PaginatedVacations>;
}>();
const emit = defineEmits<{
  (e: 'approve', row: VacationRequestDTO): void;
  (e: 'reject', row: VacationRequestDTO): void;
  (e: 'row-click', row: VacationRequestDTO): void;
}>();

const rows = ref<VacationRequestDTO[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);

async function reload() {
  loading.value = true;
  try {
    const result = await props.load({ page: page.value, pageSize: pageSize.value });
    rows.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function onPage(e: DataTablePageEvent) {
  page.value = e.page + 1;
  pageSize.value = e.rows;
  reload();
}

function days(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86400000) + 1;
}

function onRowClick(e: { data: VacationRequestDTO }) {
  emit('row-click', e.data);
}

function wasEdited(row: { createdAt: string; updatedAt: string; status: string }) {
  // If it's been decided/cancelled, updatedAt reflects that transition, not an edit. Show only on Pending.
  if (row.status !== 'Pending') return false;
  const delta = new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime();
  return delta > 60_000; // 60 seconds threshold
}

defineExpose({ reload });
reload();
</script>

<template>
  <section class="card">
    <div v-show="loading" class="hairline" aria-hidden="true">
      <div class="hairline-bar" />
    </div>
    <DataTable
      :value="rows"
      :loading="loading && rows.length === 0"
      lazy
      paginator
      :first="(page - 1) * pageSize"
      :rows="pageSize"
      :totalRecords="total"
      :rowsPerPageOptions="[10, 20, 50]"
      @page="onPage"
      @row-click="onRowClick"
      tableStyle="min-width: 100%"
    >
      <template #empty>
        <div class="empty">
          <i class="pi pi-inbox empty-icon" />
          <p class="empty-title">No requests match your filters.</p>
          <p class="empty-body">Try clearing one of the active filters above.</p>
        </div>
      </template>
      <Column header="Requester" :pt="{ bodyCell: { 'data-label': 'Requester' } }">
        <template #body="{ data }">
          <div class="requester">
            <strong>{{ data.user?.name ?? data.userId }}</strong>
            <span class="email">{{ data.user?.email }}</span>
          </div>
        </template>
      </Column>
      <Column field="startDate" header="Start" :pt="{ bodyCell: { 'data-label': 'Start' } }">
        <template #body="{ data }">{{ data.startDate }}</template>
      </Column>
      <Column field="endDate" header="End" :pt="{ bodyCell: { 'data-label': 'End' } }">
        <template #body="{ data }">{{ data.endDate }}</template>
      </Column>
      <Column header="Days" :pt="{ bodyCell: { 'data-label': 'Days' } }">
        <template #body="{ data }">{{ days(data.startDate, data.endDate) }}</template>
      </Column>
      <Column field="reason" header="Reason" :pt="{ bodyCell: { 'data-label': 'Reason' } }">
        <template #body="{ data }">
          <span class="cell-muted">{{ data.reason || '—' }}</span>
        </template>
      </Column>
      <Column header="Status" :pt="{ bodyCell: { 'data-label': 'Status' } }">
        <template #body="{ data }"><StatusBadge :status="data.status" /></template>
      </Column>
      <Column
        field="createdAt"
        header="Submitted"
        :pt="{ bodyCell: { 'data-label': 'Submitted' } }"
      >
        <template #body="{ data }">
          <div class="submitted">
            <span>{{ new Date(data.createdAt).toLocaleDateString() }}</span>
            <span
              v-if="wasEdited(data)"
              class="edited-pill"
              title="This request was edited after submission"
              >edited</span
            >
          </div>
        </template>
      </Column>
      <Column header="Actions" style="width: 160px" :pt="{ bodyCell: { 'data-label': 'Actions' } }">
        <template #body="{ data }">
          <div v-if="data.status === 'Pending'" class="actions">
            <Button
              size="small"
              :pt="{ root: { class: 'act act-approve' } }"
              @click.stop="emit('approve', data)"
              icon="pi pi-check"
              v-tooltip.top="'Approve'"
            />
            <Button
              size="small"
              :pt="{ root: { class: 'act act-reject' } }"
              @click.stop="emit('reject', data)"
              icon="pi pi-times"
              v-tooltip.top="'Reject'"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.card {
  position: relative;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 24px;
}
.hairline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  overflow: hidden;
  z-index: 1;
}
.hairline-bar {
  position: absolute;
  top: 0;
  left: -30%;
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  animation: hairline-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes hairline-slide {
  0% {
    left: -30%;
  }
  100% {
    left: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hairline-bar {
    animation: none;
    left: 0;
    width: 100%;
    opacity: 0.4;
  }
}
.submitted {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.edited-pill {
  display: inline-block;
  padding: 1px 6px;
  background: var(--surface-elevated);
  color: var(--ink-secondary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
  align-self: flex-start;
}
.requester {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.requester strong {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--ink-primary);
}
.email {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--ink-muted);
}
.cell-muted {
  color: var(--ink-secondary);
}
.actions {
  display: flex;
  gap: 6px;
}
.empty {
  text-align: center;
  padding: 40px 16px;
}
.empty-icon {
  font-size: 24px;
  color: var(--ink-muted);
}
.empty-title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 18px;
  color: var(--ink-primary);
  margin: 12px 0 4px;
}
.empty-body {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-secondary);
  margin: 0;
}

// Action buttons
:deep(.act) {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: filter 120ms;
  font-size: 13px;
  color: white;
}
:deep(.act-approve) {
  background: var(--secondary);
}
:deep(.act-reject) {
  background: var(--status-rejected);
}
:deep(.act:hover) {
  filter: brightness(0.9);
}

// DataTable
:deep(.p-datatable-table) {
  font-family: var(--font-body);
  font-size: 13px;
}
:deep(.p-datatable-thead > tr > th) {
  background: var(--surface-elevated);
  color: var(--ink-secondary);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 12px 12px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
:deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  cursor: pointer;
}
:deep(.p-datatable-tbody > tr > td) {
  padding: 14px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--ink-primary);
  transition: background 120ms;
}
:deep(.p-datatable-tbody > tr:hover > td) {
  background: var(--surface-elevated);
}
:deep(.p-paginator) {
  background: transparent;
  padding: 16px 0 0;
  justify-content: flex-end;
  font-family: var(--font-body);
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
  .card {
    padding: 12px;
  }
  :deep(.p-datatable) {
    background: transparent;
  }
  :deep(.p-datatable-thead) {
    display: none;
  }
  :deep(.p-datatable-tbody) {
    display: block;
  }
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
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-secondary);
    flex-shrink: 0;
  }
}
</style>
