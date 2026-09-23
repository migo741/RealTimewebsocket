import { createApp } from 'vue'
import { createPinia } from 'pinia'

import Preview from './components/DataTablePreview.vue'
import router from './router'

const app = createApp(Preview)

app.use(createPinia())
app.use(router)

app.mount('#app')
