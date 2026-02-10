/**
 * Agent Dashboard - Main Entry Point
 *
 * 3D visualization for monitoring multiple agents
 */

import { createApp } from 'vue'
import App from './App.vue'
import { setupErrorHandling } from './utils/errorHandler'
import './styles/compact-mode.css'
import './styles/animations.css'

// Create Vue app
const app = createApp(App)

// Setup error handling before mounting
setupErrorHandling(app)

// Mount app
app.mount('#app')

console.log('🚀 Agent Dashboard initialized')
