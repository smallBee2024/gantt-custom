<template>
  <div
    ref="ganttRef"
    className="x-gantt-wrapper"
    :style="{
      height: height,
    }"
  >
    <Table
      :head="head"
      :list="data"
      :openStatus="openStatus"
      :open="open"
      :scrollBarHeight="scrollBarHeight"
      :wrapperWidth="leftSideWidth"
      @onChange="onChange"
    />
    <TimeData
      ref="timeDataRef"
      :ganttType="ganttType"
      :list="data"
    />
    <!-- 分割线，可拖拽 -->
    <div
      :class="['gantt-resize-line', isDragging ? 'resizing' : '']"
      :style="{ left: `${resizeLinePosition}px` }"
      @mousedown="startDragging"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import 'vue3-perfect-scrollbar/style.css'

import Table from './TableData/index.vue'
import TimeData from './TimeData/index.vue'
import {
  GanttProps,
} from './types'

const props = withDefaults(defineProps<GanttProps>(), {
  height: 'auto',
  open: true,
  ganttType: 'day'
})

const emits = defineEmits(['onDateChange', 'onDataClick', 'onGanttTypeChange'])

const ganttRef = ref<HTMLDivElement>()
const timeDataRef = ref<{
  initList: () => void;
}>()

const WIDTH_LEFT = 298
const scrollBarHeight = ref(0)
const openStatus = ref(true)
const leftSideWidth = ref(WIDTH_LEFT)
const resizeLinePosition = ref(WIDTH_LEFT)
const isDragging = ref(false)

const startDragging = () => {
  isDragging.value = true
  ganttRef.value!.addEventListener('mousemove', onDragging)
  ganttRef.value!.addEventListener('mouseup', stopDragging)
}

const onDragging = (event: any) => {
  if (isDragging.value) {
    const rect = ganttRef.value!.getBoundingClientRect()
    // console.log('event.clientX', event.clientX, rect)
    const positionX = event.clientX - rect.left
    // console.log('positionX', positionX, rect)
    if (positionX >= 100 && rect.width - positionX >= 100) {
      resizeLinePosition.value = positionX
    }
  }
}
const stopDragging = () => {
  isDragging.value = false
  leftSideWidth.value = resizeLinePosition.value
  ganttRef.value!.removeEventListener('mousemove', onDragging)
  ganttRef.value!.removeEventListener('mouseup', stopDragging)
}

// 展开收起
const onChange = () => {
  openStatus.value = !openStatus.value
  setTimeout(() => {
    timeDataRef.value?.initList()
  }, 300)
}

// 监听时间变化
const onDateChange = (params: any) => {
  emits('onDateChange', params)
}
provide('onDateChange', onDateChange)
const onDataClick = (params: any) => {
  emits('onDataClick', params)
}
provide('onDataClick', onDataClick)
const onGanttTypeChange = (type: string) => {
  emits('onGanttTypeChange', type)
}
provide('onGanttTypeChange', onGanttTypeChange)

onMounted(() => {
  // console.log('props', props)
})
</script>

<style scoped lang="less">
.x-gantt-wrapper {
  --borderColor: rgba(126 134 142 /16%);
  --progressColor: #007fff;
  --finishColor: #00b042;
  --waitColor: #e0e2e4;
  --overtimeColor: #f54040;
  --finishOvertimeColor: #00b042;
  position: relative;
  user-select: none;
  display: flex;
  overflow: hidden;
  border: 1px solid var(--borderColor);
  font-family: -apple-system,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;
}
.gantt-resize-line {
  background: transparent;
  bottom: 0;
  position: absolute;
  top: 0;
  width: 2px;
  z-index: 21;
}
.gantt-resize-line.resizing, .gantt-resize-line:hover {
  background: rgb(33, 150, 243);
  cursor: ew-resize;
}
</style>