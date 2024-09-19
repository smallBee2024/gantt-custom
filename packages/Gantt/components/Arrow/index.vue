<template>
  <div
    ref="arrowRef"
    :class="props.isOpen ? 'arrow_open' : ''"
    class="main-arrow"
  />
</template>

<script setup lang="ts">
import './index.css';
import { onMounted, ref } from 'vue';
const arrowRef = ref<HTMLDivElement | null>(null);
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: '#000000',
  },
});
onMounted(() => {
  if (arrowRef.value) {
    // arrowRef.value.style.setProperty("--bg-color", props.color);
  }
});
</script>
