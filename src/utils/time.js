import { Temporal } from "@js-temporal/polyfill";

export const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
export const MILLISECONDS_IN_WEEK = MILLISECONDS_IN_DAY * 7;
export const MILLISECONDS_IN_MONTH = MILLISECONDS_IN_DAY * 31; // Rough approximation
export const MILLISECONDS_IN_YEAR = MILLISECONDS_IN_DAY * 365;

export const INTERVAL_UNIT_DAY = "day";
export const INTERVAL_UNIT_WEEK = "week";
export const INTERVAL_UNIT_MONTH = "month";
export const INTERVAL_UNIT_YEAR = "year";

function zeropad(number) {
  return number < 10 ? `0${number}` : number;
}

export function compare(a, b) {
  return Temporal.Instant.compare(a, b);
}

export function format(temporal, formatString) {
  const zonedDate = temporal.toZonedDateTimeISO("GMT");
  return zonedDate.toLocaleString("en-us", formatString);
}

export function fromMilliseconds(milliseconds) {
  return Temporal.Instant.fromEpochMilliseconds(milliseconds);
}

export function fromString(dateString, timeString = "00:00") {
  return Temporal.Instant.from(`${dateString}T${timeString}Z`);
}

export function subtract(temporal, milliseconds) {
  return temporal.subtract(Temporal.Duration.from({ milliseconds }));
}

export function getIntervalLabel(date, unit) {
  switch (unit) {
    case INTERVAL_UNIT_DAY:
      return format(date, { weekday: "short" });
    case INTERVAL_UNIT_WEEK:
      return format(date, {
        month: "short",
        day: "numeric",
      });
    case INTERVAL_UNIT_MONTH:
      return format(date, { month: "long" });
    case INTERVAL_UNIT_YEAR:
      return format(date, { year: "numeric" });
    default:
      throw Error(`Invalid unit "${unit}"`);
  }
}

export function getIntervalRange(startDate, stopDate) {
  if (!startDate || !stopDate) {
    debugger;
  }
  const startTime = startDate.epochMilliseconds;
  const stopTime = stopDate.epochMilliseconds;
  const unit = getIntervalUnit(startDate, stopDate);
  switch (unit) {
    case INTERVAL_UNIT_DAY:
    case INTERVAL_UNIT_WEEK:
    case INTERVAL_UNIT_YEAR: {
      const intervalSize = getIntervalSize(startDate, stopDate);
      const dates = [];
      for (let i = startTime; i < stopTime + intervalSize; i += intervalSize) {
        dates.push(fromMilliseconds(i));
      }
      return dates;
    }
    case INTERVAL_UNIT_MONTH: {
      const startZone = startDate.toZonedDateTimeISO("UTC");
      const stopZone = stopDate.toZonedDateTimeISO("UTC");
      const months = [];
      for (let year = startZone.year; year <= stopZone.year; year++) {
        const startMonth = year === startZone.year ? startZone.month : 1;
        const stopMonth = year === stopZone.year ? stopZone.month : 12;
        for (let month = startMonth; month <= stopMonth; month++) {
          months.push(fromString(`${year}-${zeropad(month)}-01`));
        }
      }

      const stopMonth = stopZone.month;
      if (stopMonth === 12) {
        months.push(fromString(`${stopZone.year}-12-31`, "23:59:59"));
      } else {
        months.push(
          subtract(
            fromString(`${stopZone.year}-${zeropad(stopMonth + 1)}-01`),
            1 // ms
          )
        );
      }

      return months;
    }
    default:
      throw Error(`Invalid unit "${unit}"`);
  }
}

export function getIntervalSize(startDate, stopDate) {
  const unit = getIntervalUnit(startDate, stopDate);
  switch (unit) {
    case INTERVAL_UNIT_DAY:
      return MILLISECONDS_IN_DAY;
    case INTERVAL_UNIT_WEEK:
      return MILLISECONDS_IN_WEEK;
    case INTERVAL_UNIT_YEAR:
      return MILLISECONDS_IN_YEAR;
    default:
      throw Error(`No interval or unit type "${unit}"`);
  }
}

export function getIntervalUnit(start, stop) {
  if (!start || !stop) {
    debugger;
  }
  const delta = stop.epochMilliseconds - start.epochMilliseconds;
  if (delta < MILLISECONDS_IN_DAY) {
    return INTERVAL_UNIT_DAY;
  } else if (delta < MILLISECONDS_IN_WEEK) {
    return INTERVAL_UNIT_DAY;
  } else if (delta < MILLISECONDS_IN_MONTH) {
    return INTERVAL_UNIT_WEEK;
  } else if (delta < MILLISECONDS_IN_YEAR) {
    return INTERVAL_UNIT_MONTH;
  } else {
    return INTERVAL_UNIT_YEAR;
  }
}
