<template>
  <div class="gantt-left-box">
    <!-- 展开收起按钮  -->
    <div
      v-if="props.open"
      class="gantt-left-arrrow-box"
      @click="handleOpenStatus"
    >
      <div class="gantt-left-arrrow">
        <Arrow :isOpen="!props.openStatus" class="shou-icon" color="#696B6C" />
      </div>
    </div>
    <!-- 内容区域 -->
    <div
      :style="{ width: `${wrapperWidth}px` }"
      :class="props.openStatus ? 'gantt-left' : 'gantt-left-close'"
    >
      <PerfectScrollbar class="gantt-scroll-bar">
        <div class="gantt-left-head-box">
          <div class="gantt-left-head">
            <!-- 表头i -->
            <div
              v-for="(item, index) in props.head"
              :key="index"
              :title="item.fieldName"
              class="gantt-left-head-item ellipsis"
              :style="{
                textAlign: item.align ? item.align : 'center',
                width: item.width ? item.width : '100px',
                maxWidth: item.width ? item.width : '100px',
                minWidth: item.width ? item.width : '100px',
              }"
            >
              {{ item.fieldName }}
            </div>
            <div class="gantt-left-head-item zhanwei" />
          </div>
          <!-- 内容 -->
          <div class="gantt-left-body">
            <div class="gantt-left-body-wrapper" @scroll="handleScroll">
              <div class="gantt-left-body-height">
                <div
                  v-for="(item, index) in props.list"
                  :key="index"
                  class="gantt-left-body-cell"
                  @mouseenter="tableLineMouseenter(index)"
                  @mouseleave="tableLineMouseleave(index)"
                  @click="onRowClick(item)"
                >
                  <div
                    v-for="(i, n) in props.head"
                    :key="n"
                    :title="i.fieldTag ? item[i.fieldTag] : ''"
                    :style="{
                      textAlign: i.align ? i.align : 'center',
                      width: i.width ? i.width : '100px',
                      maxWidth: i.width ? i.width : '100px',
                      minWidth: i.width ? i.width : '100px',
                    }"
                    class="gantt-left-body-cell-item ellipsis"
                  >
                    {{ i.fieldTag ? item[i.fieldTag] : "" }}
                  </div>
                  <div class="gantt-left-body-cell-item zhanwei" />
                </div>
              </div>
            </div>
            <div :style="{ height: props.scrollBarHeight + 'px' }" />
          </div>
        </div>
      </PerfectScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GanttHeadProps, GanttDataProps } from '../types'
import { ref, defineProps, onMounted, inject } from 'vue'
import Arrow from '../components/Arrow/index.vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

interface TableProps {
  head?: GanttHeadProps[];
  list: GanttDataProps[];
  scrollBarHeight: number;
  open: boolean;
  openStatus: boolean;
  wrapperWidth: number;
}
const props = defineProps<TableProps>();
const emit = defineEmits(['onChange']);
const onDataClick = inject('onDataClick') as (params: any) => void

const onRowClick = (item: any) => {
  onDataClick(item)
}
// 展开收起处理事件
const handleOpenStatus = () => {
  emit('onChange');
};
const handleScroll = (event: any) => {
  if (event && event.target) {
    document.getElementsByClassName('gantt-right-content')[0].scrollTop = event.target.scrollTop;
  }
};

const tableLineMouseenter = (index) => {
  if (document.getElementsByClassName('gantt-right-body-cell')[index]) {
    document.getElementsByClassName('gantt-right-body-cell')[index].classList.add('hoverBg')
  }
}
const tableLineMouseleave = (index) => {
  if (document.getElementsByClassName('gantt-right-body-cell')[index]) {
    document.getElementsByClassName('gantt-right-body-cell')[index].classList.remove('hoverBg')
  }
}

onMounted(() => {
  // props.openStatus.value = props.open;
});
</script>

<style scoped lang="less">
@import '../assets/variables.less';
.hoverBg {
  background: rgba(105, 115, 146, .1) !important;
}

.gantt-left {
  position: relative;
  transition: all 0.15s linear;
  height: 100%;
  overflow: hidden;
}
.gantt-scroll-bar {
  width: 100%;
  height: 100%;
}

.gantt-left-box {
  position: relative;
  height: 100%;
  border-right: 1px solid @borderColor;
}

.gantt-left-box .gantt-left-arrrow {
  transform: rotate(90deg) translateY(3px);
}

.gantt-left-head-box {
  height: 100%;
  display: inline-block;
  flex-direction: column;
  min-width: 100%;
}

.gantt-left-arrrow-box {
  position: absolute;
  top: 50%;
  right: -18px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 32px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-top-right-radius: 7px;
  border-bottom-right-radius: 7px;
  transform: translateY(-50%);
}
.gantt-left-arrrow-box:hover {
  background-color: #2196f3;
  border-color: #2196f3;
}

.gantt-left-arrrow-box:hover .shou-icon {
  --bg-color: #fff;
}

.shou-icon {
  --bg-color: #696B6C;
}

.gantt-left-close {
  position: relative;
  width: 0 !important;
  transition: all 0.15s linear;
  overflow: hidden;
}

.gantt-left-head {
  height: 60px;
  display: flex;
  line-height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid var(--borderColor);
}

.gantt-left-head .gantt-left-head-item {
  flex: 1;
  font-weight: 500;
  font-size: 15px;
  text-align: center;
}

.gantt-left-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100% - 61px);
}
.gantt-left-body-wrapper {
  flex: 1;
  overflow-x: hidden;
  overflow-y: scroll;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}
.gantt-left-body-height {
  height: 100%;
  box-sizing: border-box;
}

.gantt-left-body-height::-webkit-scrollbar {
  display: none;
  width: 0;
}


.gantt-left-body-cell {
  display: flex;
  border-bottom: 1px solid #eee;
}
.gantt-left-body-cell:hover {
  background: rgba(105, 115, 146, .1);
}

.gantt-left-body-cell:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.gantt-left-body-cell-item {
  flex: 1;
  height: 33px;
  font-size: 14px;
  line-height: 33px;
  text-align: center;
}

.gantt-left-head-item, .gantt-left-body-cell-item {
  border-right: 1px solid #eee;
}
.gantt-left-head-item:last-child, .gantt-left-body-cell-item:last-child {
  border-right: none;
}

.quan {
  position: relative;
  width: 4px;
  height: 4px;
  margin-right: 2px;
  background: #007fff;
  border-radius: 50%;
}

.quan::before {
  position: absolute;
  top: 50%;
  left: -10px;
  width: 10px;
  height: 1px;
  content: " ";
  background-color: rgba(126 134 142 /24%);
  transform: translateY(-50%);
}
</style>
