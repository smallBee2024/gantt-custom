<template>
  <div id="gantt-right" class="gantt-right">
    <div
      id="gantt-right-body"
      class="gantt-right-body"
      :style="{ width: headWidth + 'px' }"
    >
      <!-- header -->
      <div class="gantt-right-header">
        <div class="gantt-right-body-head">
          <!-- header 第一层 -->
          <div class="gantt-right-body-head-list gantt-right-head-year">
            <div
              v-for="(item, index) in yaerList"
              :key="index"
              :style="{
                width: markItemWidth * item.length + 'px',
                minWidth: markItemWidth * item.length + 'px',
              }"
              class="gantt-right-body-head-year-item"
            >
              {{ item.year }}
            </div>
          </div>
          <!-- header 第二层 -->
          <div class="gantt-right-body-head-list">
            <div
              v-for="(item, index) in days"
              :key="index"
              :style="{
                width: markItemWidth * item.length + 'px',
                minWidth: markItemWidth * item.length + 'px',
              }"
              :class="['gantt-right-head-item-day', showTodayLine(item)!.show ? 'today' : '']"
            >
              {{ getLev2HeaderName(item.year) }}
              <!-- 今天 -->
              <div v-if="showTodayLine(item)!.show" class="dot" :style="{ left: `${showTodayLine(item)!.left}px` }" />
            </div>
          </div>
        </div>
      </div>
      <!-- body -->
      <div class="gantt-right-main">
        <PerfectScrollbar id="gantt-scroll-wrapper" class="gantt-right-content" @scroll="handleScroll">
          <div class="gantt-right-body-content">
            <Mark
              :days="days"
              :data="list"
              :markItemWidth="markItemWidth"
              :ganttType="ganttType"
              :showTodayLine="showTodayLine"
            />
            <div class="gantt-items">
              <DateLine
                v-for="(item, index) in data"
                :key="item.ganttId"
                :item="item"
                :index="index"
                :ganttType="ganttType"
              />
            </div>
          </div>
        </PerfectScrollbar>
      </div>

      <!-- 时间比例 -->
      <div class="gantt-scale">
        <Dropdown trigger="click">
          <div class="scale-btn">
            <span>{{ currentScale.label }}</span>
            <svg v-if="!visible" t="1721123046559" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1337" width="16" height="21">
              <path d="M512.146286 619.52L245.296762 352.792381 193.584762 404.48l318.585905 318.415238 318.268952-318.415238-51.736381-51.687619z" fill="#311426" p-id="1338" />
            </svg>
            <svg v-else t="1721123188099" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1498" width="16" height="21">
              <path d="M512.146286 454.753524l-266.849524 266.727619L193.584762 669.744762l318.585905-318.415238 318.268952 318.415238-51.736381 51.687619z" fill="#311426" p-id="1499" />
            </svg>
          </div>
          <template #overlay>
            <Menu>
              <MenuItem v-for="item in items" :key="item.key" @click="scaleClick(item)">
                {{ item.label }}
              </MenuItem>
            </Menu>
          </template>
        </Dropdown>
      </div>
      <!-- 今天 -->
      <div v-if="isShowBackTodayBtn" class="gantt-back-to-today" @click="backToToday">今天</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, reactive, ref, inject, watch } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import isoWeek from 'dayjs/plugin/isoWeek'
import { Dropdown, Menu, MenuItem } from 'ant-design-vue';

import {
  getStartEndDays,
  getYearMonth,
  getDaysList,
  initGantt,
  debounce,
  getQuarterList,
  getScrollLeftLength,
  getYearDays,
  getYearWeeks,
} from '../utils';
import {
  GANTT_SCALE,
  QUARTER_MAP,
  LINE_ITEM_WIDTH_DAY,
  LINE_ITEM_WIDTH_WEEK,
  LINE_ITEM_WIDTH_MONTH,
  LINE_ITEM_WIDTH_QUARTER,
} from '../constant'
import {
  GanttDataProps,
  YearListIF,
  IListIF,
  GanttType,
  ScrollDirection
} from '../types';

import DateLine from './DateLine/index.vue';
import Mark from './Mark/index.vue';

interface MaxMinDate {
  startDate: string;
  endDate: string;
}

const props = withDefaults(defineProps<{
  list: GanttDataProps[];
  ganttType: GanttType;
}>(), {
});

dayjs.extend(quarterOfYear)
dayjs.extend(isoWeek)

// 时间维度选项
const items = reactive(GANTT_SCALE)
// 当前时间维度
const currentScale = ref(items[0])
// 维度切换下拉框
const visible = ref(false)

const yaerList = ref<YearListIF[]>([]); // 顶部第一行数据
const days = ref<YearListIF[]>([]); // 顶部第二行数据
// 甘特图数据
const data = ref<IListIF[]>([]);
// 每一个节点的宽度
const markItemWidth = ref(0);
// 甘特图 右侧 可视区总宽度
const headWidth = ref(0); //总宽度
// 时间范围-开始、结束时间点
const maxMinDate = reactive<MaxMinDate>({
  startDate: '',
  endDate: '',
})
// 输入数据
const dataList = ref<IListIF[]>([])
// 加载更多后，移动的距离
const afterLoadMore_ScrollLeft = ref(0)
// 加载更多，滚动的方向
const scrollDirection = ref<ScrollDirection>('')
// 跳回今天按钮 显隐
const isShowBackTodayBtn = ref(true)
// 甘特图为度
const _ganttType = ref(props.ganttType)
const onGanttTypeChange = inject('onGanttTypeChange') as (type: string) => void

watch(() => props.ganttType, (val) => {
  _ganttType.value = val
  // 从新初始化 gantt
  initList()
  scrollToToday()
})

let firstRender = false
// 初始化列表数据   && !firstRender
watch(() => props.list, (val) => {
  if (val) {
    // console.log('执行一次， timeData')
    // 从新初始化 gantt
    initList()

    if (!firstRender) {
      scrollToToday()
      firstRender = true
    }
  }
})

// 时间维度切换
const scaleClick = (item: any) => {
  onGanttTypeChange(item.key)

  currentScale.value = item
  scrollDirection.value = ''
  visible.value = false
}

// 今日线是否展示，展示位置 计算
const showTodayLine = (item: any) => {
  // console.log('我执行一次', item)
  // 日
  if (_ganttType.value === 'day') {
    return {
      show: item.year == dayjs().format('YYYY-MM-DD'),
      left: 16,
    }
  }
  // 周
  else if (_ganttType.value === 'week') {
    const objs = item.year.split('-')
    const year =objs[0]
    const week = objs[1].split('周')[0]

    const todayYear = dayjs().format('YYYY')
    const todayWeek = dayjs().isoWeek()
    const dayNum = dayjs().day() == 0 ? 7 : dayjs().day()
    return {
      show: todayYear == year && todayWeek == week,
      left: dayNum * LINE_ITEM_WIDTH_WEEK - LINE_ITEM_WIDTH_WEEK / 2,
    }
  }
  // 月
  else if (_ganttType.value === 'month') {
    let today = dayjs().format('YYYY-MM-DD')
    const dayNum = Number(today.split('-')[2]) // 本月的第几天
    return {
      show: item.year == dayjs().format('YYYY-MM'),
      left: dayNum * LINE_ITEM_WIDTH_MONTH - LINE_ITEM_WIDTH_MONTH / 2,
    }
  }
  // 季度
  else if (_ganttType.value === 'quarter') {
    let quarterStartDate = dayjs().startOf('quarter').format('YYYY-MM-DD')
    let _today = dayjs()
    let len = _today.diff(quarterStartDate, 'day') + 1 // 本季度的第几天
    const quarter = QUARTER_MAP[dayjs().quarter()]
    return {
      show: item.year == `${dayjs().format('YYYY-')}${quarter}`,
      left: len * LINE_ITEM_WIDTH_QUARTER - LINE_ITEM_WIDTH_QUARTER / 2,
    }
  }
  return {}
}

// 内容区域滚动 - header ｜ table 部分一起滚动
const handleScroll = (event: any) => {
  if (event && event.target) {
    document.getElementsByClassName('gantt-right-body-head')[0].scrollLeft =
      event.target.scrollLeft;

    document.getElementsByClassName('gantt-left-body-wrapper')[0].scrollTop =
      event.target.scrollTop;
  }
};

// 获取二级 header 名称
const getLev2HeaderName = (year: string) => {
  let name = ''
  if (_ganttType.value === 'day') {
    name = year.split('-')[2]
  } else if (_ganttType.value === 'week') {
    name = year.slice(5)
  } else if (_ganttType.value === 'month') {
    name = `${year.split('-')[1]}月`
  } else if (_ganttType.value === 'quarter') {
    name = year.split('-')[1]
  }

  return name
}

// 滚动到边界加载更多后，获取滚动条位置
const getScrollPosition = (data: YearListIF[]) => {
  if (!scrollDirection.value) return
  const weight = {
    day: LINE_ITEM_WIDTH_DAY,
    week: LINE_ITEM_WIDTH_WEEK,
    month: LINE_ITEM_WIDTH_MONTH,
    quarter: LINE_ITEM_WIDTH_QUARTER,
  }
  const type = _ganttType.value
 
  let totalDays = type === 'day' ? 31 : getScrollLeftLength({ data, type, direction: scrollDirection.value })
  if (totalDays && scrollDirection.value == 'left') {
    afterLoadMore_ScrollLeft.value = totalDays * weight[type]
  }
  else if (totalDays && scrollDirection.value == 'right') {
    const wrapper = document.getElementById('gantt-scroll-wrapper')
    const scrollLeft = wrapper!.scrollLeft
    afterLoadMore_ScrollLeft.value = scrollLeft - totalDays * weight[type]
  }
}

// 计算显示位置
const resetPosition = () => {
  const newData = dataList.value.map((e) => {
    const endDate = dayjs(e.startTime)
    const numDays = endDate.diff(maxMinDate.startDate, 'day')
    const intervalDays = getStartEndDays(e.startTime, e.endTime) // 两个日期间隔天数
    return {
      ...e,
      startTime: e.startTime,
      endTime: e.endTime,
      width: intervalDays * markItemWidth.value,
      left: numDays * markItemWidth.value, //  - 5,
    };
  });
  data.value = newData;
}

// 计算顶部最多显示多少个
const resetSize = () => {
  const offsetWidth = document.getElementById('gantt-right')?.offsetWidth;
  let contentHeight = 0 // props.headBodyPaddingY * 2;
  dataList.value.forEach((item) => {
    contentHeight += item.height;
  });

  if (offsetWidth) {
    // 每个月有多少天 [ { 'length: 29, year: '2024-02' }, ... ] 
    const years = getYearMonth(
      maxMinDate.startDate,
      maxMinDate.endDate,
      _ganttType.value
    );
    let domWidth = 0;
    // 时间跨度为天
    if (_ganttType.value === 'day') {
      const daysArray = getDaysList(maxMinDate.startDate, maxMinDate.endDate);
      // 固定写死
      domWidth = LINE_ITEM_WIDTH_DAY;
      const newDay = daysArray.map((e) => {
        return {
          year: e,
          length: 1,
        };
      });
      getScrollPosition(newDay)
      // console.log('day==', newDay, years)
      days.value = newDay;
      yaerList.value = years;
    }
    else if (_ganttType.value === 'week') {
      domWidth = LINE_ITEM_WIDTH_WEEK
      const weeks = getYearWeeks(maxMinDate.startDate, maxMinDate.endDate,)
      // 从新计算滚动条位置
      getScrollPosition(weeks)
      // console.log('week===', weeks, years)
      days.value = weeks
      yaerList.value = years // [{ length: 61, year: '2023' }, ...]
    }
    // 时间跨度为月
    else if (_ganttType.value === 'month') {
      // 每天占多少px，固定8px
      domWidth = LINE_ITEM_WIDTH_MONTH
      // 获取年日列表
      const showYear: YearListIF[] = getYearDays(years)
      // 从新计算滚动条位置
      getScrollPosition(years)
      days.value = years
      yaerList.value = showYear // [{ length: 61, year: '2023' }, ...]
    }
    // 时间跨度为季度
    else if (_ganttType.value === 'quarter') {
      domWidth = LINE_ITEM_WIDTH_QUARTER
      // 获取年日列表
      const showYear: YearListIF[] = getYearDays(years)
      const quarter = getQuarterList(years)
      // 从新计算滚动条位置
      getScrollPosition(quarter)
      days.value = quarter
      yaerList.value = showYear // [{ length: 61, year: '2023' }, ...]
    }
    // 计算位置
    headWidth.value = offsetWidth
    markItemWidth.value = domWidth
    resetPosition()
  }
};

// 计算第一次加载时，时间范围
const setInitDate = () => {
  if (_ganttType.value === 'day') {
    const today = new Date();
    // 计算今天前62天的日期
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 62);
    
    // 计算今天后62天的日期
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 62);

    maxMinDate.startDate = dayjs(minDate).format('YYYY-MM-DD');
    maxMinDate.endDate = dayjs(maxDate).format('YYYY-MM-DD');
  }
  else if (_ganttType.value === 'week') {
    maxMinDate.startDate = dayjs().subtract(17, 'week').startOf('isoWeek').format('YYYY-MM-DD')
    maxMinDate.endDate = dayjs().add(17, 'week').endOf('isoWeek').format('YYYY-MM-DD')
  }
  else if (_ganttType.value === 'month') {
    maxMinDate.startDate = dayjs().subtract(8, 'month').startOf('month').format('YYYY-MM-DD')
    maxMinDate.endDate = dayjs().add(8, 'month').endOf('month').format('YYYY-MM-DD')
  }
  else if (_ganttType.value === 'quarter') {
    maxMinDate.startDate = dayjs().subtract(10, 'quarter').startOf('quarter').format('YYYY-MM-DD')
    maxMinDate.endDate = dayjs().add(10, 'quarter').endOf('quarter').format('YYYY-MM-DD')
  }
}

// 初始数组的处理
const initList = () => {
  data.value = [];
  if (!props.list || !props.list.length) return
  // 数据处理，添加了一些其它字段
  dataList.value = initGantt(props.list);

  setInitDate()
  resetSize()
}

const backToToday = () => {
  initList()
  scrollToToday()
}
const scroolToFun = (left: number) => {
  nextTick(() => {
    const wrapper = document.getElementById('gantt-scroll-wrapper')
    const maxScrollLeft = wrapper!.scrollWidth - wrapper!.clientWidth;
    const safeScrollLeft = Math.max(0, Math.min(left, maxScrollLeft));

    // console.log('scroolToFun', safeScrollLeft, left);
    wrapper!.scrollTo({
      left: safeScrollLeft,
    })
  });
}

// 滚动到今天位置
const scrollToToday = () => {
  nextTick(() => {
    const wrapper = document.getElementById('gantt-scroll-wrapper')
    const contentEle = document.getElementsByClassName('gantt-right-body-content')[0]
    const left = contentEle.scrollWidth / 2 - wrapper!.clientWidth / 2;
    scroolToFun(left)
  });
}

// 无限滚动加载更多日期
const loadMoreDays = (direction: ScrollDirection) => {
  // console.log('loadMoreDays');
  scrollDirection.value = direction;

  if (_ganttType.value === 'day') {
    if (direction === 'left') {
      maxMinDate.startDate = dayjs(maxMinDate.startDate).subtract(31, 'day').format('YYYY-MM-DD')
      maxMinDate.endDate = dayjs(maxMinDate.endDate).subtract(31, 'day').format('YYYY-MM-DD')
      // afterLoadMore_ScrollLeft.value = 32 * 31;
    } else {
      maxMinDate.startDate = dayjs(maxMinDate.startDate).add(31, 'day').format('YYYY-MM-DD')
      maxMinDate.endDate = dayjs(maxMinDate.endDate).add(31, 'day').format('YYYY-MM-DD')
      // afterLoadMore_ScrollLeft.value = scrollLeft - 32 * 31
    }
  } else if (_ganttType.value === 'week') {
    const loadMoreNum = 8
    if (direction === 'left') {
      maxMinDate.startDate = dayjs(maxMinDate.startDate).subtract(loadMoreNum, 'week').format('YYYY-MM-DD')
      maxMinDate.endDate = dayjs(maxMinDate.endDate).subtract(loadMoreNum, 'week').format('YYYY-MM-DD')
    } else {
      maxMinDate.startDate = dayjs(maxMinDate.startDate).add(loadMoreNum, 'week').format('YYYY-MM-DD')
      maxMinDate.endDate = dayjs(maxMinDate.endDate).add(loadMoreNum, 'week').format('YYYY-MM-DD')
    }
  } else if (_ganttType.value === 'month') {
    const loadMoreNum = 4
    if (direction === 'left') {
      maxMinDate.startDate = dayjs(maxMinDate.startDate).subtract(loadMoreNum, 'month').format('YYYY-MM-DD')
      maxMinDate.endDate = dayjs(maxMinDate.endDate).subtract(loadMoreNum, 'month').format('YYYY-MM-DD')
    } else {
      maxMinDate.startDate = dayjs(maxMinDate.startDate).add(loadMoreNum, 'month').format('YYYY-MM-DD')
      maxMinDate.endDate = dayjs(maxMinDate.endDate).add(loadMoreNum, 'month').format('YYYY-MM-DD')
    }
  } else if (_ganttType.value === 'quarter') {
    const loadMoreNum = 5
    if (direction === 'left') {
      maxMinDate.startDate = dayjs(maxMinDate.startDate).subtract(loadMoreNum, 'quarter').startOf('quarter').format('YYYY-MM-DD')
      maxMinDate.endDate = dayjs(maxMinDate.endDate).subtract(loadMoreNum, 'quarter').endOf('quarter').format('YYYY-MM-DD')
    } else {
      maxMinDate.startDate = dayjs(maxMinDate.startDate).add(loadMoreNum, 'quarter').startOf('quarter').format('YYYY-MM-DD')
      maxMinDate.endDate = dayjs(maxMinDate.endDate).add(loadMoreNum, 'quarter').endOf('quarter').format('YYYY-MM-DD')
    }
  }
  
  resetSize()
  scroolToFun(afterLoadMore_ScrollLeft.value)
}

let _scrollLeft = 0;
// 监听容器滚动
const rightContentScroll = (e: any) => {
  const wrapper = document.getElementById('gantt-scroll-wrapper')
  const scrollLeft = wrapper!.scrollLeft
  const scrollWidth = wrapper!.scrollWidth
  const clientWidth = wrapper!.clientWidth

  if (_scrollLeft != 0 && Math.abs(_scrollLeft - scrollLeft) > 100) {
    if (_scrollLeft - scrollLeft > 0) {
      // scroolToFun(_scrollLeft - 6)
      wrapper!.scrollTo(_scrollLeft - 6, wrapper!.scrollTop)
    } else {
      wrapper!.scrollTo(_scrollLeft + 6, wrapper!.scrollTop)
      return
    }
  } else {
    if (scrollLeft === 0) {
    loadMoreDays('left')
    }
    if (scrollLeft + clientWidth >= scrollWidth) {
      loadMoreDays('right')
    }
  }
  _scrollLeft = scrollLeft;
  
  // 控制年份滚动
  nextTick(() => {
    const yearChildren = document.querySelectorAll('.gantt-right-body-head-year-item');
    yearChildren.forEach((child: any) => {
      const childLeft = child.offsetLeft;
      const childRight = childLeft + child.offsetWidth;
      
      if (scrollLeft - childLeft > 8 && childRight > scrollLeft) {
        child.style.textIndent = `${scrollLeft - childLeft}px`;
      } else {
        child.style.textIndent = '8px';
      }
    });
  })

  // 今日线位置
  let todayEles: any = document.getElementsByClassName('today')
  if (todayEles.length) {
    let todayEle = todayEles[0]
    // 今日线是否在可视区范围内
    if (scrollLeft > todayEle.offsetLeft || scrollLeft + clientWidth < todayEle.offsetLeft) {
      if (isShowBackTodayBtn.value == false) {
        isShowBackTodayBtn.value = true
      }
    } else {
      if (isShowBackTodayBtn.value == true) {
        isShowBackTodayBtn.value = false
      }
    }
  }
}

onMounted(() => {
  // console.log('onMounted');
  initList();
  // 监听窗口变化
  window.addEventListener('resize', debounce(initList, 200))

  const wrapper = document.getElementById('gantt-scroll-wrapper')
  // 监听滚动到最左和最右
  wrapper!.addEventListener('scroll', rightContentScroll)

  if (props.ganttType) {
    const temp = { day: 0, week: 1, month: 2, quarter: 3 }
    currentScale.value = items[temp[props.ganttType]]
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', initList)
  const wrapper = document.getElementById('gantt-scroll-wrapper')
  wrapper!.removeEventListener!('scroll', rightContentScroll)
})

defineExpose({
  initList,
});
</script>

<style scoped lang="less">
@import '../assets/variables.less';
.gantt-right {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.gantt-right-body {
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.gantt-right-body-item {
  padding: 3px 10px;
  cursor: pointer;
  background-color: transparent;
  border-left: 1px solid @borderColor;
}

.gantt-right-header {
  display: flex;
}
.gantt-right-body-head {
  display: flex;
  flex-direction: column;
  height: 60px;
  overflow: hidden;
  flex: 1;
  position: relative;
  border-bottom: 1px solid @borderColor;
}

.gantt-right-body-head::-webkit-scrollbar {
  display: none;
}


.gantt-right-body-head .gantt-right-body-head-list {
  display: flex;
  flex: 1;
}

.gantt-right-body-head .gantt-right-body-head-list .gantt-right-head-item-day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  line-height: 100%;
  font-size: 12px;
  color: #5f6673;
  box-sizing: border-box;
  border-left: 1px solid @borderColor;
  position: relative;
}

.gantt-right-body-head-year-item {
  display: flex;
  align-items: center;
  padding-left: 8px;
  height: 100%;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-bottom: 1px solid var(--borderColor);
  border-left: 1px solid var(--borderColor);
}

.gantt-right-body-head-year-item:first-child {
  border-left: 0;
}

.gantt-right-body-head
  .gantt-right-body-head-list
  .gantt-right-head-item-day:first-child {
  border-left: 0;
}

.gantt-right-main {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 100%;
  width: 100%;
}
.gantt-right-content {
  bottom: 0;
  left: 0;
  overflow: auto;
  position: absolute;
  right: 0;
  top: 0;
}
.gantt-right-body-content {
  position: relative;
  float: left;
}
.gantt-items {
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  overflow: hidden;
}

.today {
  color: #00b899 !important;
  position: relative;
}
.dot {
  background: #00b899;
  border-radius: 50%;
  bottom: 0;
  height: 7px;
  margin-left: -3px;
  position: absolute;
  width: 7px;
  z-index: 10;
}
.gantt-scale {
  background: #fff;
  position: absolute;
  right: 0;
  top: 0;
  width: auto;
}
.scale-btn {
  border-left: 1px solid #ebecee;
  width: 53px;
  height: 30px;
  display: flex;
  justify-content: space-around;
  padding: 0 5px;
  align-items: center;
  user-select: none;

  span {
    margin-right: 5px;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.gantt-back-to-today {
  position: absolute;
  right: 70px;
  top: 3px;
  width: 42px;
  height: 23px;
  line-height: 23px;
  font-size: 14px;
  text-align: center;
  background-color: #e6f8f5;
  color: #00b899;
  user-select: none;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
}
</style>