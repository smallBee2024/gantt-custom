<template>
  <div className="gantt-right-body-content-mark" :style="{ height: markHeight }">
    <div
      v-for="(item) in props.days"
      :key="item.year"
      :class="['gantt-right-body-content-mark-item', getWeekend(item)]"
      :style="{
        width: props.markItemWidth * item.length + 'px',
        minWidth: props.markItemWidth * item.length + 'px',
        height: '100%',
      }"
    >
      <div
        v-if="showTodayLine(item)!.show"
        class="today-line"
        :style="{ left: `${showTodayLine(item)!.left}px` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import { YearListIF, GanttType } from '../../types'

interface Props {
  days: YearListIF[];
  data: any[],
  markItemWidth: number;
  showTodayLine: any
  ganttType: GanttType
}
const props = defineProps<Props>();
const markHeight = ref()

// let firstRender = false
// 初始化列表数据
watch(() => props.data, (val) => {
  if (val) {
    const wrapperHeight = document.getElementsByClassName('gantt-right-main')[0]?.clientHeight || 0
    const _height = val.length * 34
    if (_height > wrapperHeight) {
      markHeight.value = `${val.length * 34}px`
    } else {
      markHeight.value = `${wrapperHeight}px`
    }
  }
}, { immediate: true })

const getWeekend = (item: YearListIF) => {
  if (props.ganttType === 'day') {
    if (dayjs(item.year).day() == 0 || dayjs(item.year).day() == 6) {
      // 周末
      return 'weekend-item'
    }
  }
  return ''
}
onMounted(() => {
  // console.log('第几周', dayjs().day())
})
</script>

<style scoped lang="less">
@import '../../assets/variables.less';
.gantt-right-body-content-mark {
  display: flex;
}
.gantt-right-body-content-mark-item {
  position: relative;
  box-sizing: border-box;
  border-left: 1px solid @borderColor;
}
.gantt-right-body-content-mark-item:first-child {
  border-left: 0;
}

.today-line {
  background: #00b899;
  bottom: 0;
  position: absolute;
  top: 0;
  width: 1px;
  z-index: 10;
}
</style>

