/** Gujarati labels for tithi / paksha / choghadiya (shop calendar). */

export const PAKSHA_GU: Record<string, string> = {
  Shukla: 'સુદ',
  Krishna: 'વદ',
};

export const PAKSHA_HI: Record<string, string> = {
  Shukla: 'शुक्ल',
  Krishna: 'कृष्ण',
};

const TITHI_BASE_GU: Record<string, string> = {
  Pratipada: 'એકમ',
  Dwitiya: 'બીજ',
  Tritiya: 'ત્રીજ',
  Chaturthi: 'ચોથ',
  Panchami: 'પાંચમ',
  Shashthi: 'છઠ',
  Saptami: 'સાતમ',
  Ashtami: 'આઠમ',
  Navami: 'નવમ',
  Dashami: 'દશમ',
  Ekadashi: 'અગિયારસ',
  Dwadashi: 'બારસ',
  Trayodashi: 'તેરસ',
  Chaturdashi: 'ચૌદસ',
  Purnima: 'પૂનમ',
  Amavasya: 'અમાસ',
};

const TITHI_BASE_HI: Record<string, string> = {
  Pratipada: 'प्रतिपदा',
  Dwitiya: 'द्वितीया',
  Tritiya: 'तृतीया',
  Chaturthi: 'चतुर्थी',
  Panchami: 'पंचमी',
  Shashthi: 'षष्ठी',
  Saptami: 'सप्तमी',
  Ashtami: 'अष्टमी',
  Navami: 'नवमी',
  Dashami: 'दशमी',
  Ekadashi: 'एकादशी',
  Dwadashi: 'द्वादशी',
  Trayodashi: 'त्रयोदशी',
  Chaturdashi: 'चतुर्दशी',
  Purnima: 'पूर्णिमा',
  Amavasya: 'अमावस्या',
};

const CHOGHADIYA_GU: Record<string, string> = {
  Amrit: 'અમૃત',
  Kaal: 'કાળ',
  Shubh: 'શુભ',
  Rog: 'રોગ',
  Udveg: 'ઉદ્વેગ',
  Char: 'ચર',
  Labh: 'લાભ',
  अमृत: 'અમૃત',
  काल: 'કાળ',
  शुभ: 'શુભ',
  रोग: 'રોગ',
  उद्वेग: 'ઉદ્વેગ',
  चर: 'ચર',
  लाभ: 'લાભ',
};

export function tithiLabels(name: string, paksha: string): { hi: string; gu: string } {
  const base = name.replace(/^(Shukla|Krishna)\s+/i, '').trim();
  const hiBase = TITHI_BASE_HI[base] ?? base;
  const guBase = TITHI_BASE_GU[base] ?? base;
  const pkHi = PAKSHA_HI[paksha] ?? paksha;
  const pkGu = PAKSHA_GU[paksha] ?? paksha;

  if (base === 'Purnima' || base === 'Amavasya') {
    return { hi: hiBase, gu: guBase };
  }

  return {
    hi: `${pkHi} ${hiBase}`,
    gu: `${pkGu} ${guBase}`,
  };
}

export function choghadiyaGu(name: string): string {
  return CHOGHADIYA_GU[name] ?? name;
}

export function qualityFromLabel(qualityName: string): 'shubh' | 'ashubh' | 'neutral' {
  const q = qualityName.toLowerCase();
  if (q.includes('शुभ') || q.includes('shubh') || q.includes('auspicious')) return 'shubh';
  if (q.includes('अशुभ') || q.includes('ashubh') || q.includes('inauspicious')) return 'ashubh';
  return 'neutral';
}
