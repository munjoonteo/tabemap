import { AWARD_LABELS } from '../types/restaurant';
import type { Award, AwardType } from '../types/restaurant';
import { Tooltip } from './Tooltip';

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const AWARD_COLORS: Record<AwardType, string> = {
  hyakumeiten:
    'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  gold: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800',
  silver:
    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600',
  bronze:
    'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
};

function awardDetail(a: Award): string {
  if (a.type === 'hyakumeiten') {
    return a.category ? `${formatCategory(a.category)} ${a.year}` : String(a.year);
  }
  return String(a.year);
}

// Groups awards of the same type, returns one badge per type with tooltip listing all years/categories
interface GroupedAward {
  type: AwardType;
  label: string;
  tooltip: string;
}

export function groupAwards(awards: Award[]): GroupedAward[] {
  const byType = new Map<AwardType, Award[]>();
  for (const a of awards) {
    if (!byType.has(a.type)) byType.set(a.type, []);
    byType.get(a.type)!.push(a);
  }

  const order: AwardType[] = ['hyakumeiten', 'gold', 'silver', 'bronze'];
  return order
    .filter((t) => byType.has(t))
    .map((t) => {
      const group = byType.get(t)!.sort((a, b) => b.year - a.year);
      return {
        type: t,
        label: AWARD_LABELS[t],
        tooltip: group.map(awardDetail).join('\n'),
      };
    });
}

interface Props {
  awards: Award[];
}

export function AwardBadges({ awards }: Props) {
  if (!awards || awards.length === 0) return null;
  return (
    <>
      {groupAwards(awards).map((g) => (
        <Tooltip key={g.type} text={g.tooltip}>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded border ${AWARD_COLORS[g.type]}`}
          >
            {g.label}
          </span>
        </Tooltip>
      ))}
    </>
  );
}
