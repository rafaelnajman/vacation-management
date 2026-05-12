import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export function registerGuards(router: Router) {
  router.beforeEach(to => {
    const auth = useAuthStore();
    const isPublic = !!to.meta.public;

    if (isPublic) {
      if (auth.isAuthenticated) {
        return auth.role === 'Validator' ? { name: 'validator' } : { name: 'requester' };
      }
      return true;
    }

    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    const required = to.meta.role as 'Requester' | 'Validator' | undefined;
    if (required && auth.role !== required) {
      return auth.role === 'Validator' ? { name: 'validator' } : { name: 'requester' };
    }
    return true;
  });
}
