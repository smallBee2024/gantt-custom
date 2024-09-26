<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import {
//   Gantt,
//   type GanttDataProps,
//   type GanttHeadProps,
//   type GanttRefProps,
// } from '../packages/Gantt/index'
import {
  Gantt,
  type GanttDataProps,
  type GanttHeadProps,
  type GanttRefProps,
} from 'gantt-custom'
import 'gantt-custom/style.css'

const list = ref<GanttDataProps[]>([]);
const head: GanttHeadProps[] = [
  {
    fieldName: "人数",
    fieldTag: "num",
    width: '100px',
  },
  {
    fieldName: "开始时间",
    fieldTag: "startTime",
    width: '100px',
  },
  {
    fieldName: "结束时间",
    fieldTag: "endTime",
    width: '100px',
  },
]
const ganttRef = ref<GanttRefProps>()
const ganttType = ref('day')

function getUUID() {
  let uuid = '';
  const hexDigits = '0123456789abcdef';

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else {
      const randomDigit = Math.floor(Math.random() * 16);
      uuid += hexDigits[i === 19 ? (randomDigit & 0x3) | 0x8 : randomDigit];
    }
  }

  return uuid;
}
// 拖拽结束：修改时间轴数据
const onDateChange = (params: any) => {
  console.log('onDateChange', params);
  list.value = list.value.map((item: GanttDataProps) => {
    if (item.id == params.id) {
      return {
        ...item,
        startTime: params.startTime,
        endTime: params.endTime,
      }
    }
    return item
  })
}
const onDataClick = (params: any) => {
  console.log('onDataClick', params);
  alert('点击了')
}
// 切换甘特图时间维度
const onGanttTypeChange = (type: string) => {
  ganttType.value = type
}
// 异步获取数据
const getData = () => {
  setTimeout(() => {
    list.value = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3].map((item, index) => {
      return {
        startTime: index % 2 == 1 ? "2024-9-10" : '2024-9-19',
        endTime: index % 2 == 1 ? "2024-9-18" : '2024-9-21',
        finishTime: null,
        dept: "技术部",
        num: "2人",
        time: "2天",
        start: true,
        time2: "结束时间",
        id: getUUID()
      }
    })
  });
}

onMounted(() => {
  getData()
})
</script>

<template>
  <div class="app-wrapper">
    <Gantt
      :head="head"
      :data="list"
      :ganttType="ganttType"
      height="100%"
      @onDateChange="onDateChange"
      @onDataClick="onDataClick"
      @onGanttTypeChange="onGanttTypeChange"
    />
  </div>
</template>

<style scoped>
.app-wrapper {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 30px;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
}
</style>
