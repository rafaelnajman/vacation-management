import 'primeicons/primeicons.css';
import './styles/main.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';

import App from './App.vue';
import router from './router/index';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.never-dark', // disable dark mode via a selector that never matches
      cssLayer: false,
    },
  },
});
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);

// Restore auth before first navigation
import { useAuthStore } from './stores/auth';
const authStore = useAuthStore();
authStore.restore().finally(() => {
  router.isReady().then(() => app.mount('#app'));
});
