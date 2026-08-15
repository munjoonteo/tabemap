import type { AwardType } from '../types/restaurant';

export const AWARD_TYPES: AwardType[] = ['gold', 'silver', 'bronze', 'hyakumeiten'];

export const AWARD_ACTIVE: Record<AwardType, string> = {
  hyakumeiten: 'bg-red-600 text-white border-red-600',
  gold: 'bg-yellow-500 text-white border-yellow-500',
  silver: 'bg-gray-500 text-white border-gray-500',
  bronze: 'bg-orange-600 text-white border-orange-600',
};

export const AWARD_INACTIVE: Record<AwardType, string> = {
  hyakumeiten:
    'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:border-red-400',
  gold: 'text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800 hover:border-yellow-500',
  silver:
    'text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-500',
  bronze:
    'text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:border-orange-400',
};
