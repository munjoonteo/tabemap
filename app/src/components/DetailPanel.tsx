import { useState } from 'react';
import { tagColor } from '../lib/tags';
import { tCuisine } from '../lib/translations';
import { PRICE_TIER_LABELS } from '../types/restaurant';
import type { Restaurant } from '../types/restaurant';
import { AwardBadges } from './AwardBadge';

interface Props {
  restaurant: Restaurant;
  allTags: string[];
  isAuthenticated: boolean;
  isDark: boolean;
  isEnglish: boolean;
  onSave: (r: Restaurant) => void;
  onClose: () => void;
}

export function DetailPanel({
  restaurant,
  allTags,
  isAuthenticated,
  isDark,
  isEnglish,
  onSave,
  onClose,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(restaurant);
  const [tagInput, setTagInput] = useState('');

  function addTag(tag: string) {
    const t = tag.trim();
    if (t && !draft.tags.includes(t)) {
      setDraft((d) => ({ ...d, tags: [...d.tags, t] }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setDraft((d) => ({ ...d, tags: d.tags.filter((t) => t !== tag) }));
  }

  function handleSave() {
    onSave(draft);
    setEditing(false);
  }

  const r = editing ? draft : restaurant;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate pr-4">
          {restaurant.name}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && (
            <>
              <button
                onClick={() => onSave({ ...restaurant, visited: !restaurant.visited })}
                className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                  restaurant.visited
                    ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                {restaurant.visited ? '✓ Visited' : 'Mark visited'}
              </button>
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setDraft(restaurant);
                    }}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:text-gray-300 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:text-gray-300 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Edit
                </button>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1.5">
          <div className="text-xs text-gray-600 dark:text-gray-200">
            {tCuisine(r.cuisine, isEnglish)} · {PRICE_TIER_LABELS[r.price_tier]}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-300 truncate">{r.address}</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.address)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0 hover:underline"
            >
              ↗
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={r.tabelog_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              ★ {r.tabelog_rating.toFixed(2)}
            </a>
            {r.personal_rating != null && (
              <span className="text-xs text-rose-500">♥ {r.personal_rating.toFixed(1)}</span>
            )}
          </div>
        </div>

        {/* Awards (read-only, scraped) */}
        {r.awards?.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
              Awards
            </label>
            <div className="flex flex-wrap gap-1">
              <AwardBadges awards={r.awards} />
            </div>
          </div>
        )}

        {/* Tags (manual, editable) */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-1 mb-2">
            {r.tags.map((tag) => {
              const color = tagColor(tag);
              return (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border"
                  style={{
                    borderColor: color,
                    backgroundColor: isDark ? 'transparent' : `${color}18`,
                    color: isDark ? '#e5e7eb' : color,
                  }}
                >
                  {tag}
                  {editing && (
                    <button
                      onClick={() => removeTag(tag)}
                      className="opacity-60 hover:opacity-100 leading-none"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag(tagInput)}
                placeholder="Add tag..."
                list="tag-suggestions"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="tag-suggestions">
                {allTags
                  .filter((t) => !draft.tags.includes(t))
                  .map((t) => (
                    <option key={t} value={t} />
                  ))}
              </datalist>
              <button
                onClick={() => addTag(tagInput)}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">
            Notes
          </label>
          {editing ? (
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              rows={4}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Personal notes..."
            />
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {r.notes || <span className="text-gray-400 dark:text-gray-600">No notes yet</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
