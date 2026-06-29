import { getDailyPanchang } from 'panchang-ts';
import { APP_TIMEZONE } from '@turnover/shared';
import type { ChoghadiyaSlot, TithiInfo } from '@turnover/shared';
import {
  PAKSHA_GU,
  PAKSHA_HI,
  choghadiyaGu,
  qualityFromLabel,
  tithiLabels,
} from './tithi.labels.js';

/** Default: Ahmedabad — Gujarat shops (IST display). */
export const DEFAULT_PANCHANG_LOCATION = {
  latitude: 23.0225,
  longitude: 72.5714,
};

const IST_OFFSET_MINUTES = 330;

function parseIsoDate(date: string): Date {
  return new Date(`${date}T12:00:00+05:30`);
}

function formatIstTime(iso: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

function mapTithi(name: string, paksha: string): TithiInfo {
  const labels = tithiLabels(name, paksha);
  return {
    name,
    paksha: paksha as TithiInfo['paksha'],
    nameHi: labels.hi,
    nameGu: labels.gu,
    pakshaHi: PAKSHA_HI[paksha] ?? paksha,
    pakshaGu: PAKSHA_GU[paksha] ?? paksha,
  };
}

function mapChoghadiyaSlot(slot: {
  name: string;
  qualityName: string;
  start: Date | string;
  end: Date | string;
}): ChoghadiyaSlot {
  return {
    name: slot.name,
    nameGu: choghadiyaGu(slot.name),
    quality: qualityFromLabel(slot.qualityName),
    qualityLabel: slot.qualityName,
    start: formatIstTime(slot.start),
    end: formatIstTime(slot.end),
  };
}

export interface DayPanchang {
  tithi: TithiInfo | null;
  tithis: TithiInfo[];
  nakshatra: string | null;
  varaHi: string | null;
  varaEn: string | null;
  sunrise: string | null;
  sunset: string | null;
  choghadiya: { day: ChoghadiyaSlot[]; night: ChoghadiyaSlot[] } | null;
}

export function getPanchangForDate(date: string): DayPanchang | null {
  const result = getDailyPanchang(parseIsoDate(date), DEFAULT_PANCHANG_LOCATION, {
    timezone: IST_OFFSET_MINUTES,
    language: 'hi',
    masaSystem: 'purnimanta',
  });

  if (!result) return null;

  const tithis = (result.tithis ?? []).map((t) => mapTithi(t.name, t.paksha));
  const primaryTithi = tithis[0] ?? null;

  const choghadiya =
    result.choghadiya?.day?.length
      ? {
          day: result.choghadiya.day.map(mapChoghadiyaSlot),
          night: (result.choghadiya.night ?? []).map(mapChoghadiyaSlot),
        }
      : null;

  return {
    tithi: primaryTithi,
    tithis,
    nakshatra: result.nakshatras?.[0]?.name ?? null,
    varaHi: result.vara?.name ?? null,
    varaEn: result.vara?.englishName ?? null,
    sunrise: result.sunrise ? formatIstTime(result.sunrise) : null,
    sunset: result.sunset ? formatIstTime(result.sunset) : null,
    choghadiya,
  };
}

export function getPanchangForMonth(month: string): Map<string, DayPanchang> {
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const map = new Map<string, DayPanchang>();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    const panchang = getPanchangForDate(date);
    if (panchang) map.set(date, panchang);
  }

  return map;
}
