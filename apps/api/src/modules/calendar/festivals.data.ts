/** Major festivals — Hindi & Gujarati names (2025–2026). Dates are Gregorian. */

export interface FestivalEntry {
  date: string;
  nameHi: string;
  nameGu: string;
  category: 'hindu' | 'national' | 'gujarati' | 'season';
}

export const FESTIVALS: FestivalEntry[] = [
  { date: '2025-01-14', nameHi: 'मकर संक्रांति / उत्तरायण', nameGu: 'ઉત્તરાયણ', category: 'gujarati' },
  { date: '2025-01-26', nameHi: 'गणतंत्र दिवस', nameGu: 'ગણતંત્ર દિવસ', category: 'national' },
  { date: '2025-03-14', nameHi: 'होली', nameGu: 'હોળી', category: 'hindu' },
  { date: '2025-08-09', nameHi: 'रक्षा बंधन', nameGu: 'રક્ષાબંધન', category: 'hindu' },
  { date: '2025-08-27', nameHi: 'गणेश चतुर्थी', nameGu: 'ગણેશ ચતુર્થી', category: 'hindu' },
  { date: '2025-10-02', nameHi: 'गांधी जयंती', nameGu: 'ગાંધી જયંતી', category: 'national' },
  { date: '2025-10-12', nameHi: 'दशहरा / विजयादशमी', nameGu: 'દશેરા', category: 'hindu' },
  { date: '2025-10-20', nameHi: 'दीवाली', nameGu: 'દીવાળી', category: 'hindu' },
  { date: '2025-11-01', nameHi: 'गुजराती नव वर्ष', nameGu: 'નવું વર્ષ (Bestu Varas)', category: 'gujarati' },
  { date: '2025-11-05', nameHi: 'भाई दूज', nameGu: 'ભાઈ બીજ', category: 'hindu' },
  { date: '2026-01-14', nameHi: 'मकर संक्रांति / उत्तरायण', nameGu: 'ઉત્તરાયણ', category: 'gujarati' },
  { date: '2026-01-26', nameHi: 'गणतंत्र दिवस', nameGu: 'ગણતંત્ર દિવસ', category: 'national' },
  { date: '2026-03-03', nameHi: 'होली', nameGu: 'હોળી', category: 'hindu' },
  { date: '2026-03-19', nameHi: 'गुड़ी पड़वा / चैत्र नवरातri', nameGu: 'ચૈત્રી નવરાત્રી', category: 'hindu' },
  { date: '2026-04-14', nameHi: 'वैशाखी / नव वर्ष', nameGu: 'વસાયો', category: 'hindu' },
  { date: '2026-07-20', nameHi: 'गुरु पूर्णिमा', nameGu: 'ગુરુ પૂર્ણિમા', category: 'hindu' },
  { date: '2026-08-09', nameHi: 'रक्षा बंधन', nameGu: 'રક્ષાબંધન', category: 'hindu' },
  { date: '2026-08-27', nameHi: 'गणेश चतुर्थी', nameGu: 'ગણેશ ચતુર્થી', category: 'hindu' },
  { date: '2026-09-14', nameHi: 'अनंत चतुर्दशी', nameGu: 'અનંત ચૌદસ', category: 'hindu' },
  { date: '2026-10-02', nameHi: 'गांधी जयंती', nameGu: 'ગાંધી જયંતી', category: 'national' },
  { date: '2026-10-11', nameHi: 'नवरातri शुरू', nameGu: 'નવરાત્રી', category: 'hindu' },
  { date: '2026-10-20', nameHi: 'दशहरा', nameGu: 'દશેરા', category: 'hindu' },
  { date: '2026-11-08', nameHi: 'दीवाली', nameGu: 'દીવાળી', category: 'hindu' },
  { date: '2026-11-09', nameHi: 'गुजराती नव वर्ष', nameGu: 'નવું વર્ષ (Bestu Varas)', category: 'gujarati' },
  { date: '2026-11-11', nameHi: 'भाई दूज', nameGu: 'ભાઈ બીજ', category: 'hindu' },
  { date: '2026-12-25', nameHi: 'क्रिसमस', nameGu: 'નાતાલ', category: 'season' },
];

export function festivalsForMonth(month: string): FestivalEntry[] {
  return FESTIVALS.filter((f) => f.date.startsWith(month));
}

export function festivalOnDate(date: string): FestivalEntry | undefined {
  return FESTIVALS.find((f) => f.date === date);
}
