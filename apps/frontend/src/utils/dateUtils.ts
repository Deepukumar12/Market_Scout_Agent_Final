/**
 * Centralized Date and Time Utilities for IST (Asia/Kolkata, UTC+05:30)
 * All display timestamps on the website must utilize these functions to ensure
 * consistency, 12-hour formatting with AM/PM, and Asia/Kolkata timezone display.
 */

export function parseDate(dateInput: any): Date | null {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date to: DD MMM YYYY, hh:mm AM/PM (e.g. 14 Jun 2026, 09:30 AM)
 */
export function formatToIST(dateInput: any): string {
  const date = parseDate(dateInput);
  if (!date) return '';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  let day = '', month = '', year = '', hour = '', minute = '', dayPeriod = '';
  for (const part of parts) {
    if (part.type === 'day') day = part.value;
    else if (part.type === 'month') month = part.value;
    else if (part.type === 'year') year = part.value;
    else if (part.type === 'hour') hour = part.value;
    else if (part.type === 'minute') minute = part.value;
    else if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
  }

  return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
}

/**
 * Formats a time to: hh:mm AM/PM (e.g. 09:30 AM)
 */
export function formatTimeToIST(dateInput: any): string {
  const date = parseDate(dateInput);
  if (!date) return '';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  let hour = '', minute = '', dayPeriod = '';
  for (const part of parts) {
    if (part.type === 'hour') hour = part.value;
    else if (part.type === 'minute') minute = part.value;
    else if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
  }

  return `${hour}:${minute} ${dayPeriod}`;
}

/**
 * Formats a date to: DD MMM YYYY (e.g. 14 Jun 2026)
 */
export function formatShortDateToIST(dateInput: any): string {
  const date = parseDate(dateInput);
  if (!date) return '';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  let day = '', month = '', year = '';
  for (const part of parts) {
    if (part.type === 'day') day = part.value;
    else if (part.type === 'month') month = part.value;
    else if (part.type === 'year') year = part.value;
  }

  return `${day} ${month} ${year}`;
}
