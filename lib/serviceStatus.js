// Service suspension logic — shared by customer site, checkout and admin.
//
// settings.serviceStatus = {
//   mode: 'open' | 'stopped' | 'scheduled',
//   notice: string,          // message shown to customers
//   stopFrom: number|null,   // epoch ms — scheduled mode only
//   resumeFrom: number|null, // epoch ms — scheduled mode only (null = until manually resumed)
// }

export const DEFAULT_NOTICE =
  'We have temporarily paused new orders. Please check back shortly — thank you for your patience!';

export const DEFAULT_SERVICE_STATUS = {
  mode: 'open',
  notice: '',
  stopFrom: null,
  resumeFrom: null,
};

/**
 * Works out whether ordering is currently blocked.
 * Returns:
 *   suspended  — true when customers must not be able to order
 *   upcoming   — true when a stop is scheduled but has not started yet
 *   notice     — message to display
 *   stopFrom   — epoch ms the pause starts (upcoming only)
 *   resumeFrom — epoch ms service resumes (null = until further notice)
 */
export function getServiceState(settings) {
  const s = settings?.serviceStatus;
  const idle = { suspended: false, upcoming: false, notice: '', stopFrom: null, resumeFrom: null };
  if (!s || !s.mode || s.mode === 'open') return idle;

  const notice = (s.notice || '').trim() || DEFAULT_NOTICE;

  // Stopped right now, until manually resumed
  if (s.mode === 'stopped') {
    return { suspended: true, upcoming: false, notice, stopFrom: null, resumeFrom: null };
  }

  // Scheduled window
  if (s.mode === 'scheduled' && s.stopFrom) {
    const now = Date.now();
    const started = now >= s.stopFrom;
    const finished = s.resumeFrom ? now >= s.resumeFrom : false;

    if (started && !finished) {
      return { suspended: true, upcoming: false, notice, stopFrom: s.stopFrom, resumeFrom: s.resumeFrom || null };
    }
    if (!started) {
      return { suspended: false, upcoming: true, notice, stopFrom: s.stopFrom, resumeFrom: s.resumeFrom || null };
    }
  }

  return idle;
}

/** Friendly date/time for notices, e.g. "Mon 22 Sep, 6:00 PM" */
export function formatServiceTime(ms) {
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/** epoch ms -> value for <input type="datetime-local"> (local time) */
export function msToLocalInput(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value -> epoch ms (interpreted as local time) */
export function localInputToMs(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}
