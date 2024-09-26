<template>
  <!-- 行 -->
  <div
    class="gantt-right-body-cell"
    @mouseenter="cellMouseenter"
    @mouseleave="cellMouseleave"
  >
    <!-- 蓝色方块 -->
    <div 
      v-if="props.item.width > 0"
      :id="`gantt-progressBar-Id${props.index}`"
      class="progressBar"
      :style="{
        left: props.item.left + 'px',
      }"
      @mousedown="startDragging"
      @mouseup="endDragging"
      @mouseenter="onBlueMouseEnter"
      @mouseleave="onBlueMouseLeave"
    >
      <div class="progressBar-box" :style="progressBarStyle">
        <!-- <div class="progressBar-active" :style="{ width: props.item.progress * 100 + '%' }" /> -->
      </div>

      <div v-if="props.item.chartLabel" class="field-label">{{ props.item.chartLabel }}</div>
      <div
        class="drag-left allow-drag"
        :style="{ display: isDragging || isHovered ? 'block' : 'none' }"
        @mousedown.stop="e => onMarginMousedown('left', e)"
        @mouseup="endDragging"
      />
      <div
        class="drag-right allow-drag"
        :style="{ display: isDragging || isHovered ? 'block' : 'none' }"
        @mousedown.stop="e => onMarginMousedown('right', e)"
        @mouseup="endDragging"
      />
    </div>
  </div>
  <!-- hover气泡 -->
  <div v-if="isHovered || isDragging" class="gantt-popover" :style="popoverStyle">
    <div class="text-item">开始时间：{{ popoverTime.startTime }}</div>
    <div class="text-item">结束时间：{{ popoverTime.endTime }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, inject } from 'vue'
import dayjs from 'dayjs'
import { IListIF } from '../../types'
import {
  LINE_ITEM_WIDTH_DAY,
  LINE_ITEM_WIDTH_WEEK,
  LINE_ITEM_WIDTH_MONTH,
  LINE_ITEM_WIDTH_QUARTER,
} from '../../constant'

interface Props {
  item: IListIF;
  index: number;
  ganttType: string;
}
const props = defineProps<Props>();

const isDragging = ref(false)
const isHovered = ref(false)
const popoverStyle = ref({})
// 拖动时，时间备份数据（随拖动改变）
const popoverTime = reactive({
  startTime: props.item.startTime,
  endTime: props.item.endTime,
})

const onDateChange = inject('onDateChange') as (params: any) => void
const onDataClick = inject('onDataClick') as (params: any) => void

// 不同维度的时间 天的宽度
const itemWidth = computed(() => {
  if (props.ganttType === 'day') {
    return LINE_ITEM_WIDTH_DAY
  } else if (props.ganttType === 'week') {
    return LINE_ITEM_WIDTH_WEEK
  } else if (props.ganttType === 'month') {
    return LINE_ITEM_WIDTH_MONTH
  } else if (props.ganttType === 'quarter') {
    return LINE_ITEM_WIDTH_QUARTER
  }
  return 0
})

const progressBarStyle = computed(() => {
  const temp: any = {
    width: `${props.item.width}px`,
  }
  if (props.item.progress) {
    temp.background = `linear-gradient(to right, rgb(99, 178, 238) ${props.item.progress * 100}%, rgba(99, 178, 238, 0.5) 0px)`
  }
  return temp
})

const cellMouseenter = () => {
  document.getElementsByClassName('gantt-left-body-cell')[props.index].classList.add('hoverBg')
  // console.log('时间线 enter', props.index)
};
const cellMouseleave = () => {
  document.getElementsByClassName('gantt-left-body-cell')[props.index].classList.remove('hoverBg')
  // console.log('时间线 leave', props.index)
}

const onBlueMouseEnter = (event: any) => {
  isHovered.value = true
  const { clientX } = event
  const rect = event.target.getBoundingClientRect()
  let _left = clientX
  if (document.body.clientWidth - clientX < 180) {
    _left = document.body.clientWidth - 150
  }

  popoverStyle.value = {
    left: `${_left}px`,
    top: `${rect.y + rect.height}px`,
  }
}
const onBlueMouseLeave = () => {
  isHovered.value = false
}

// 开始拖动时，鼠标的位置
let startDraggingPositionX = 0
// 移动了几个格子
let cellNum = 0
// 缓存选择的时间线边缘（左、右）
let _type = 'left'
// 移动格子数及方向：正数向右，负数向左
let cellDirection = 0

// 获取时间：前或后的一天
const getNewOneDay = ({ st, et, method }: { st?: boolean, et?: boolean, method: string }) => {
  st && (popoverTime.startTime = dayjs(popoverTime.startTime)[method](1, 'day').format('YYYY-MM-DD'))
  et && (popoverTime.endTime = dayjs(popoverTime.endTime)[method](1, 'day').format('YYYY-MM-DD'))
  // console.log('popoverTime', popoverTime)
}

let sd_t = 0
/**
 * 移动整条时间线
 * @param e 
 */
const startDragging = (e) => {
  sd_t = new Date().getTime()
  isDragging.value = true
  startDraggingPositionX = e.clientX
  document.addEventListener('mousemove', onBlockMouseMove);
  document.addEventListener('mouseup', onBlockMouseUp);
}
const endDragging = () => {
  // 如果点击时间线的时间小于500ms，则认为是点击
  if (new Date().getTime() - sd_t < 500) {
    onDataClick(props.item)
  }
}
/**
 * 需求实现：
 * 确定鼠标拖动方向：左、右
 * 向左拖时间整体向后移，向右拖整体向前移
 * 1. 计算鼠标移动的距离，达到一定距离后，开始移动
 * 2. 移动后重新计算时间（gpt）
 */
const onBlockMouseMove = (event) => {
  // console.log('onBlockMouseMove', event)
  if (!isDragging.value) return;
  const { clientX } = event;
  const { left, width } = props.item;
  const diff = clientX - startDraggingPositionX;
  const diff_abs = Math.abs(diff);

  let cellNumTemp = Math.floor(diff_abs / itemWidth.value)
  if (cellNumTemp != cellNum) {
    // 鼠标在起始位置的右侧
    if (Math.sign(diff) > 0) {
      if (cellNumTemp - cellNum > 0) { // 向右移动
        props.item.left = left + itemWidth.value
        cellDirection += 1

        getNewOneDay({ st: true, et: true, method: 'add' })
      } else { // 向左移动
        props.item.left = left - itemWidth.value
        cellDirection -= 1

        getNewOneDay({ st: true, et: true, method: 'subtract' })
      }
    }
    // 鼠标在起始位置的左侧
    else {
      if (cellNumTemp - cellNum > 0) { // 向左移动
        props.item.left = left - itemWidth.value
        cellDirection -= 1

        getNewOneDay({ st: true, et: true, method: 'subtract' })
      } else { // 向右移动
        props.item.left = left + itemWidth.value
        cellDirection += 1

        getNewOneDay({ st: true, et: true, method: 'add' })
      }
    }
  }
  cellNum = cellNumTemp
}
const onBlockMouseUp = (e) => {
  document.removeEventListener('mousemove', onBlockMouseMove);
  document.removeEventListener('mouseup', onBlockMouseUp);
  isDragging.value = false;
  cellNum = 0

  // 计算移动后的时间
  const params = {
    startTime: '',
    endTime: '',
    id: props.item.id,
  }
  const num = Math.abs(cellDirection)
  if (num != 0) {
    const startTime = dayjs(props.item.startTime)
    const endTime = dayjs(props.item.endTime)
    const method = Math.sign(cellDirection) > 0 ? 'add' : 'subtract'

    params.startTime = startTime[method](num, 'day').format('YYYY-MM-DD')
    params.endTime = endTime[method](num, 'day').format('YYYY-MM-DD')
    // 
    props.item.startTime = params.startTime
    props.item.endTime = params.endTime

    onDateChange(params)
    cellDirection = 0
  }
}

/**
 * 移动时间线 左右的边界
 * @param type 'left' | 'right'
 * @param event
 */
const onMarginMousedown = (type: 'left' | 'right', event: any) => {
  // console.log('onMousedown', type, event)
  sd_t = new Date().getTime()
  _type = type
  isDragging.value = true;
  startDraggingPositionX = event.clientX
  document.addEventListener('mousemove', onMarginMouseMove);
  document.addEventListener('mouseup', onMarginMouseUp);
}
const onMarginMouseMove = (event) => {
  if (!isDragging.value) return
  const { clientX } = event
  const { left, width } = props.item
  const diff = clientX - startDraggingPositionX
  const diff_abs = Math.abs(diff)
  let cellNumTemp = Math.floor(diff_abs / itemWidth.value) // 移动了几个格子

  // console.log('diff', diff, diff_abs)
  if (cellNumTemp != cellNum) { // 移动超过一个格子
    // -----------------------左侧边界移动
    if (_type === 'left') {
      // 鼠标在起始位置的右侧
      if (Math.sign(diff) > 0) {
        // 移动格子数在增加 - 正在向右移动
        if (cellNumTemp - cellNum > 0) {
          if (width - itemWidth.value > 0) {
            props.item.width = width - itemWidth.value
            props.item.left = left + itemWidth.value
            cellDirection += 1
            getNewOneDay({ st: true, method: 'add' })
          }
        }
        // 移动格子数在减少 - 正在向左移动
        else {
          props.item.width = width + itemWidth.value
          props.item.left = left - itemWidth.value
          cellDirection -= 1
          getNewOneDay({ st: true, method: 'subtract' })
        }
      }
      // 鼠标在起始位置的左侧
      else {
        // 移动格子数在增加 - 正在向左移动
        if (cellNumTemp - cellNum > 0) {
          props.item.width = width + itemWidth.value
          props.item.left = left - itemWidth.value
          cellDirection -= 1
          getNewOneDay({ st: true, method: 'subtract' })
        }
        // 移动格子数在减少 - 正在向右移动
        else {
          props.item.width = width - itemWidth.value
          props.item.left = left + itemWidth.value
          cellDirection += 1
          getNewOneDay({ st: true, method: 'add' })
        }
      }
    }
    // -----------------------右侧边界移动
    else {
      // 鼠标在起始位置的右侧
      if (Math.sign(diff) > 0) {
        // 移动格子数在增加 - 正在向右移动
        if (cellNumTemp - cellNum > 0) {
          props.item.width = width + itemWidth.value
          cellDirection += 1
          getNewOneDay({ et: true, method: 'add' })
        }
        // 移动格子数在减少 - 正在向左移动
        else {
          props.item.width = width - itemWidth.value
          cellDirection -= 1
          getNewOneDay({ et: true, method: 'subtract' })
        }
      }
      // 鼠标在起始位置的左侧
      else {
        // 移动格子数在增加 - 正在向左移动
        if (cellNumTemp - cellNum > 0) {
          if (width - itemWidth.value > 0) {
            props.item.width = width - itemWidth.value
            cellDirection -= 1
            getNewOneDay({ et: true, method: 'subtract' })
          }
        }
        // 移动格子数在减少 - 正在向右移动
        else {
          props.item.width = width + itemWidth.value
          cellDirection += 1
          getNewOneDay({ et: true, method: 'add' })
        }
      }
    }
  }
  cellNum = cellNumTemp
}
const onMarginMouseUp = () => {
  document.removeEventListener('mousemove', onMarginMouseMove);
  document.removeEventListener('mouseup', onMarginMouseUp);
  isDragging.value = false
  cellNum = 0

  // console.log('cellDirection==', _type, cellDirection, props.item)
  // 出发拖动时间线 事件，然后清空缓存 cellDirection
  const params = {
    startTime: '',
    endTime: '',
    id: props.item.id,
  }
  const num = Math.abs(cellDirection)
  if (num == 0) return
  if (_type === 'left') {
    const startTime = dayjs(props.item.startTime)
    // 向右移动
    if (Math.sign(cellDirection) > 0) {
      params.startTime = startTime.add(num, 'day').format('YYYY-MM-DD')
    }
    // 左移动
    else {
      params.startTime = startTime.subtract(num, 'day').format('YYYY-MM-DD')
    }
    params.endTime = props.item.endTime
    // 修改parops值
    props.item.startTime = params.startTime
  }
  else {
    const endTime = dayjs(props.item.endTime)
    // 向右移动
    if (Math.sign(cellDirection) > 0) {
      params.endTime = endTime.add(num, 'day').format('YYYY-MM-DD')
    }
    // 左移动
    else {
      params.endTime = endTime.subtract(num, 'day').format('YYYY-MM-DD')
    }
    params.startTime = props.item.startTime
    // 修改parops值
    props.item.endTime = params.endTime
  }

  onDateChange(params)
  cellDirection = 0
}
</script>

<style scoped lang="less">
.hoverBg {
  background: rgba(105, 115, 146, .1) !important;
}
.gantt-right-body-cell {
  height: 34px;
  position: relative;
  display: flex;
}
.gantt-right-body-cell:hover {
  background: rgba(105, 115, 146, .1);
}

.gantt-right-body-cell:last-child .gantt-right-body-item {
  border-bottom: 0;
}
.gantt-right-body-cell .gantt-right-body-item:first-child {
  border-left: 0;
}

.drag-left {
  bottom: 0;
  display: none;
  left: 0;
  position: absolute;
  top: 0;
  width: 9px;
}
.drag-right {
  bottom: 0;
  display: none;
  position: absolute;
  right: 0;
  top: 0;
  width: 9px;
}

.drag-left.allow-drag:before {
  background: #fff;
  border-radius: 3px;
  bottom: 7px;
  content: "";
  left: 2px;
  position: absolute;
  top: 7px;
  -webkit-transform: scaleX(.5);
  transform: scaleX(.5);
  width: 3px;
}
.drag-left.allow-drag:after {
  background: #fff;
  border-radius: 3px;
  bottom: 5px;
  content: "";
  position: absolute;
  right: 0;
  top: 5px;
  -webkit-transform: scaleX(.5);
  transform: scaleX(.5);
  width: 3px;
}

.drag-right.allow-drag:before {
  background: #fff;
  border-radius: 3px;
  bottom: 5px;
  content: "";
  left: 0;
  position: absolute;
  top: 5px;
  -webkit-transform: scaleX(.5);
  transform: scaleX(.5);
  width: 3px;
}
.drag-right.allow-drag:after {
    background: #fff;
    border-radius: 3px;
    bottom: 7px;
    content: "";
    position: absolute;
    right: 2px;
    top: 7px;
    -webkit-transform: scaleX(.5);
    transform: scaleX(.5);
    width: 3px;
}


.progressBar {
  position: absolute;
  top: 50%;
  left: 0;
  // z-index: 2;
  display: flex;
  align-items: center;
  border-radius: 6px;
  opacity: 1;
  transition: opacity 0.2s linear;
  transform: translateY(-50%);
  cursor: move;
}
.progressBar-box {
  position: relative;
  display: flex;
  height: 25px;
  background: rgb(99, 178, 238);
  border-radius: 4px;
}
.progressBar-box:hover {
  outline: 2px solid;
  outline-color: rgba(99, 178, 238, 0.3);
}
.progressBar:hover .drag-left, .progressBar:hover .drag-right {
  display: block;
}
.allow-drag {
  cursor: ew-resize;
}
.field-label {
  color: #525967;
  font-size: 12px;
  left: 0;
  line-height: 25px;
  margin: 0 4px;
  overflow: hidden;
  position: absolute;
  left: 100%;
  max-width: 280px;
  text-overflow: ellipsis;
  user-select: none;
  white-space: nowrap;
}
.gantt-popover {
  position: fixed;
  z-index: 9999;
  background: rgba(1, 11, 31, 0.68);
  border-radius: 4px;
  box-shadow: 0 9px 28px 8px rgba(0, 0, 0, .05), 0 3px 6px -4px rgba(0, 0, 0, .12), 0 6px 16px 0 rgba(0, 0, 0, .08);
  color: #fff;
  font-size: 12px;
  line-height: 20px;
  max-width: 400px;
  padding: 4px 8px;
  word-break: break-word;
  word-wrap: break-word;
}
</style>