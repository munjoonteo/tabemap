import type { Restaurant } from '../types/restaurant';
import { extractArea, extractPrefecture } from '../types/restaurant';

// Tokyo's 23 special wards — shown before other cities within Tokyo
export const TOKYO_23_WARDS = new Set([
  '千代田区',
  '中央区',
  '港区',
  '新宿区',
  '文京区',
  '台東区',
  '墨田区',
  '江東区',
  '品川区',
  '目黒区',
  '大田区',
  '世田谷区',
  '渋谷区',
  '中野区',
  '杉並区',
  '豊島区',
  '北区',
  '荒川区',
  '板橋区',
  '練馬区',
  '足立区',
  '葛飾区',
  '江戸川区',
]);

// JIS X 0401 order (north to south)
export const PREF_ORDER = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
];

export function groupAreasByPrefecture(
  allRestaurants: Restaurant[],
): { pref: string; areas: string[] }[] {
  const prefMap = new Map<string, Set<string>>();
  for (const r of allRestaurants) {
    const area = extractArea(r.address);
    const pref = extractPrefecture(r.address);
    if (!area) continue;
    if (!prefMap.has(pref)) prefMap.set(pref, new Set());
    prefMap.get(pref)!.add(area);
  }

  const sortAreas = (pref: string, areas: string[]) => {
    if (pref === '東京都') {
      const wards = areas.filter((a) => TOKYO_23_WARDS.has(a)).sort();
      const cities = areas.filter((a) => !TOKYO_23_WARDS.has(a)).sort();
      return [...wards, ...cities];
    }
    return areas.sort();
  };

  return [...prefMap.entries()]
    .sort(([a], [b]) => {
      const ai = PREF_ORDER.indexOf(a);
      const bi = PREF_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b, 'ja');
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([pref, areaSet]) => ({ pref, areas: sortAreas(pref, [...areaSet]) }));
}
