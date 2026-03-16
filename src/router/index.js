import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ForClients from '../views/ForClients.vue'
import ForISPs from '../views/ForISPs.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/clients', name: 'ForClients', component: ForClients },
  { path: '/isps', name: 'ForISPs', component: ForISPs },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
