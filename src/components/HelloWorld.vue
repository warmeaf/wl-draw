<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>

  <h1>{{ msg }}</h1>

  <div class="card">
     <n-button type="primary" @click="count++"
      > <i-mdi:counter class="mr-1" /> count is {{ count }} </n-button
    >
    <p class="mt-4">
       <i-lucide:edit class="inline-block mr-1" /> Edit <code>components/HelloWorld.vue</code> to
      test HMR
    </p>
     <!-- 图标示例 -->
    <div class="mt-4 flex gap-4 items-center">
       <span class="flex items-center gap-1"
        > <i-heroicons:hand-raised-solid class="text-blue-500" /> <span>平移工具</span> </span
      > <span class="flex items-center gap-1"
        > <i-material-symbols:square-outline class="text-green-500" /> <span>矩形工具</span> </span
      > <span class="flex items-center gap-1"
        > <i-lucide:circle class="text-purple-500" /> <span>圆形工具</span> </span
      >
    </div>

  </div>

  <p class="text-red-500">
     Check out <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>

  <p>
     Learn more about IDE Support for Vue in the <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>

  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>

</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>

