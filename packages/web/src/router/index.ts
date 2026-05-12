import { createRouter, createWebHistory } from 'vue-router';
import { registerGuards } from './guards';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',          name: 'home',      redirect: () => ({ name: 'requester' }) },
    { path: '/login',     name: 'login',     component: () => import('@/views/LoginView.vue'),     meta: { public: true } },
    { path: '/register',  name: 'register',  component: () => import('@/views/RegisterView.vue'),  meta: { public: true } },
    { path: '/requester', name: 'requester', component: () => import('@/views/RequesterView.vue'), meta: { role: 'Requester' } },
    { path: '/validator', name: 'validator', component: () => import('@/views/ValidatorView.vue'), meta: { role: 'Validator' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ],
});

registerGuards(router);
export default router;
