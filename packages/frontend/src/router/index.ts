import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/chat',
        name: 'Chat',
        component: () => import('@/views/ChatView.vue')
    },
    {
        path: '/apps',
        name: 'Apps',
        component: () => import('@/views/AppsView.vue')
    },
    {
        path: '/knowledge',
        name: 'Knowledge',
        component: () => import('@/views/KnowledgeView.vue')
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/ProfileView.vue')
    },
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/config/:id?',
        name: 'ConfigView',
        component: () => import('@/views/ConfigView.vue'),
        props: true
    },
    {
        path: '/configs',
        name: 'ConfigList',
        component: () => import('../views/ConfigList.vue'),
        props: true
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        children: [
            {
                path: '',
                redirect: '/settings/general'
            },
            {
                path: 'general',
                name: 'GeneralSettings',
                component: () => import('@/views/settings/GeneralSettings.vue')
            },
            {
                path: 'model',
                name: 'ModelSettings',
                component: () => import('@/views/settings/ModelSettings.vue')
            },
            {
                path: 'search',
                name: 'SearchSettings',
                component: () => import('@/views/settings/SearchSettings.vue')
            },
            {
                path: 'server',
                name: 'ServerSettings',
                component: () => import('@/views/settings/ServerSettings.vue')
            },
            {
                path: 'display',
                name: 'DisplaySettings',
                component: () => import('@/views/settings/DisplaySettings.vue')
            },
            {
                path: 'miniapp',
                name: 'MiniAppSettings',
                component: () => import('@/views/settings/MiniAppSettings.vue')
            },
            {
                path: 'shortcut',
                name: 'ShortcutSettings',
                component: () => import('@/views/settings/ShortcutSettings.vue')
            },
            {
                path: 'assistant',
                name: 'AssistantSettings',
                component: () => import('@/views/settings/AssistantSettings.vue')
            },
            {
                path: 'phrase',
                name: 'PhraseSettings',
                component: () => import('@/views/settings/PhraseSettings.vue')
            },
            {
                path: 'data',
                name: 'DataSettings',
                component: () => import('@/views/settings/DataSettings.vue')
            },
            {
                path: 'about',
                name: 'AboutSettings',
                component: () => import('@/views/settings/AboutSettings.vue')
            }
        ]
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router