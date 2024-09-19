// 一个格子的宽度
export const LINE_ITEM_WIDTH_DAY = 32;
export const LINE_ITEM_WIDTH_WEEK = 16;
export const LINE_ITEM_WIDTH_MONTH = 8;
export const LINE_ITEM_WIDTH_QUARTER = 2;

// 一天有多少秒
export const SECOND_COUNT_OF_ONE_DAY = 86400000;

// 时间维度选项
export const GANTT_SCALE = [
  {
    key: 'day',
    value: 'day',
    label: '日',
    title: '日',
  },
  {
    key: 'week',
    value: 'week',
    label: '周',
    title: '周',
  },
  {
    key: 'month',
    value: 'month',
    label: '月',
    title: '月',
  },
  {
    key: 'quarter',
    value: 'quarter',
    label: '季',
    title: '季',
  }
]

// 季度映射
export const QUARTER_MAP = {
  1: '一季度',
  2: '二季度',
  3: '三季度',
  4: '四季度',
};