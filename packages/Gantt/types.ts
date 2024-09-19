export type ScrollDirection = 'left' | 'right' | '';

export type GanttType = 'day' | 'week' | 'month' | 'quarter';

export interface GanttDataProps {
  startTime: string;
  endTime: string;
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface GanttHeadProps {
  fieldName: string // 字段名
  fieldTag: string // 字段标签 类似id
  width?: string;
  key?: string;
  align?: 'center' | 'left' | 'right';
}

export interface IListIF extends GanttDataProps {
  ganttId: string;
  left: number;
  width: number;
  progress: number;
}

export interface GanttProps {
  /**
   * 数据 ✅
   */
  data: any[];
  /**
   * 表头 ✅
   */
  head?: GanttHeadProps[];
  /**
   * 表头
   */
  ganttType?: GanttType;
  /**
   * 高度： 甘特图 跟元素容器高度 ✅
   */
  height?: string;
  /**
   * 是否显示左侧收起按钮
   */
  open?: boolean;
}

export interface YearListIF {
  year: string;
  length: number;
}

