<script setup lang="ts">
import { ref } from 'vue';
import AppShell from '@/layouts/AppShell.vue';
import RequestForm from '@/components/RequestForm.vue';
import MyRequestsTable from '@/components/MyRequestsTable.vue';
import RequestDetailPanel from '@/components/RequestDetailPanel.vue';

const tableRef = ref<InstanceType<typeof MyRequestsTable> | null>(null);
const detailId = ref<string | null>(null);

function onCreated() { tableRef.value?.reload(); }
</script>

<template>
  <AppShell>
    <div class="grid-2">
      <RequestForm @created="onCreated" />
      <MyRequestsTable ref="tableRef" @row-click="(row) => detailId = row.id" />
    </div>
    <RequestDetailPanel :id="detailId" @close="detailId = null" @updated="tableRef?.reload()" />
  </AppShell>
</template>

<style scoped lang="scss">
.grid-2 {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1023px) {
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
