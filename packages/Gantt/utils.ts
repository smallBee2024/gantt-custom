import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek'
import {
  GanttDataProps,
  GanttType,
  IListIF,
  YearListIF,
  ScrollDirection,
} from './types';
import {
  LINE_ITEM_WIDTH_DAY,
  SECOND_COUNT_OF_ONE_DAY,
  QUARTER_MAP
} from './constant'

dayjs.extend(isoWeek)

const getMonthBetween = (start: string, end: string): string[] => {
  const startDate = new Date(start.slice(0, 8));
  const endDate = new Date(end.slice(0, 8));
  const result: string[] = [];
  while (startDate <= endDate) {
    result.push(dayjs(startDate).format('YYYY-MM'));
    startDate.setMonth(startDate.getMonth() + 1);
  }
  return result;
};

export const getYearMonth = (
  startTime: string,
  endTime: string,
  showDateType: GanttType
): YearListIF[] => {
  const startDate = new Date(startTime);
  const endDate =
    showDateType === 'day'
      ? new Date(endTime)
      : new Date(new Date(endTime).getTime() + SECOND_COUNT_OF_ONE_DAY * 30);
  const currentDate = startDate;
  const yearList: YearListIF[] = [];
  if (showDateType === 'day') {
    const dateMonth = getMonthBetween(startTime, endTime);
    dateMonth.forEach((item, index) => {
      const year = Number(item.split('-')[0]);
      const month = Number(item.split('-')[1]);
      if (index === 0) {
        yearList.push({
          year: `${year}-${month}`,
          length:
            dayjs(startTime).endOf('month').date() -
            dayjs(startTime).date() +
            1,
        });
      } else if (index === dateMonth.length - 1) {
        yearList.push({
          year: `${year}-${month}`,
          length: new Date(endTime).getDate(),
        });
      } else {
        yearList.push({
          year: `${year}-${month}`,
          length: new Date(year, month, 0).getDate(),
        });
      }
    });
  } else if (showDateType === 'month' || showDateType === 'quarter') {
    const dateArray: string[] = [];
    while (currentDate <= endDate) {
      dateArray.push(dayjs(currentDate).format('YYYY-MM'));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    dateArray.forEach((item) => {
      const year = Number(item.split('-')[0]);
      const month = Number(item.split('-')[1]);
      const monthStr = item.split('-')[1]
      yearList.push({
        year: `${year}-${monthStr}`,
        length: new Date(year, month, 0).getDate(),
      });
    });
  } else if (showDateType === 'week') {
    const startDate = dayjs(startTime);
    const endDate = dayjs(endTime);
    const months: YearListIF[] = [];

    let current = startDate // 备份开始时间

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      const startOfMonth = current;
      const endOfMonth = current.endOf('month').isAfter(endDate) ? endDate : current.endOf('month');
      
      const length = endOfMonth.diff(startOfMonth, 'day') + 1;
      const yearMonth = startOfMonth.format('YYYY-MM');

      months.push({
        year: yearMonth,
        length: length
      });
      current = current.add(1, 'month').startOf('month');
    }

    return months;
  }

  return yearList;
};

export const getDaysList = (start: string, end: string) => {
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const datesInRange: string[] = [];
  for (
    let currentDate = startDate;
    currentDate.isBefore(endDate);
    currentDate = currentDate.add(1, 'day')
  ) {
    datesInRange.push(currentDate.format('YYYY-MM-DD'));
  }
  datesInRange.push(end);

  return datesInRange;
};

export const getStartEndDays = (start: string, end: string) => {
  if (start && end) {
    const _start = dayjs(start)
    const _end = dayjs(end)
    if (_end.isBefore(_start)) {
      return 0
    }
    
    return _end.diff(_start, 'day') + 1;
  } else {
    return 0
  }
};

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;

  return function (this: unknown, ...args: Parameters<T>): void {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

export function getUUID() {
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

export const initGantt = (list: GanttDataProps[]) => {
  const newlist: IListIF[] = [];
  list.forEach((item, index) => {
    newlist.push({
      ...item,
      ganttId: item.id ? item.id : getUUID(),
      height: LINE_ITEM_WIDTH_DAY,
      left: 0,
      width: 0,
    });
  });
  return newlist;
};


// 将年月 分隔成季度，并计算每个季度的天数
export const getQuarterList = (data: YearListIF[]): YearListIF[] => {
  const quarters: YearListIF[] = [];

  const groupedData = {};

  // 先将数据按照年份和季度分组
  data.forEach((item) => {
    const [year, monthNum] = item.year.split('-').map(Number);
    const quarter = Math.ceil(monthNum / 3);

    if (!groupedData[year]) {
      groupedData[year] = {}
    }
    if (!groupedData[year][quarter]) {
      groupedData[year][quarter] = []
    }
    groupedData[year][quarter].push(item);
  });

  // 计算每个季度的天数
  for (const year in groupedData) {
    for (const quarter in groupedData[year]) {
      const length = groupedData[year][quarter].reduce((sum, month) => sum + month.length, 0);
      quarters.push({
        year: `${year}-${QUARTER_MAP[quarter]}`,
        length: length,
      });
    }
  }

  return quarters;
}

// 通过年月集合，计算出 年-天 集合
export const getYearDays = (data: YearListIF[]): YearListIF[] => {
  const noRepeatYear: { [key: string]: YearListIF } = {};
  const showYear: YearListIF[] = [];
  data.forEach((item) => {
    const year = Number(item.year.split('-')[0]);
    const month = Number(item.year.split('-')[1]);
    if (noRepeatYear[year]) {
      noRepeatYear[year].length += new Date(year, month, 0).getDate();
    } else {
      noRepeatYear[year] = {
        length: new Date(year, month, 0).getDate(),
        year: item.year.slice(0, 4),
      };
    }
  });
  /** 
   * noRepeatYear-对象
   * { '2023': { "length": 61, "year": "2023" } }
   */
  // 对象转数组
  for (const key in noRepeatYear) {
    showYear.push(noRepeatYear[key])
  }

  return showYear;
}

export const getYearWeeks = (start: string, end: string) => {
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const weeks: YearListIF[] = [];

  let current = startDate // startDate.startOf('isoWeek');

  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      const startOfWeek = current;
      const endOfWeek = current.endOf('isoWeek').isAfter(endDate) ? endDate : current.endOf('isoWeek');
      
      const length = endOfWeek.diff(startOfWeek, 'day') + 1;
      const yearWeek = `${startOfWeek.isoWeekYear()}-${startOfWeek.isoWeek()}周${current.format('DD')}日-${endOfWeek.format('DD')}日`;

      weeks.push({
        year: yearWeek,
        length: length
      });

      current = current.add(1, 'week').startOf('isoWeek');
  }

  return weeks;
}

export const getScrollLeftLength = (
  params: {
    data: YearListIF[],
    type: GanttType,
    direction: ScrollDirection
  }
): number => {
  const { data, type, direction } = params;
  const len = {
    day: 1,
    week: 8,
    month: 4,
    quarter: 5,
  }
  let temp: YearListIF[] = []
  if (direction === 'left') {
    temp = data.slice(0, len[type]);
  } else {
    temp = data.slice(data.length - len[type], data.length);
  }

  return temp.reduce((pre: any, cur: any) => {
    return pre + cur.length;
  }, 0)
}