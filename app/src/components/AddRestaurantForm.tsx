import { useState } from 'react';
import { PRICE_TIER_LABELS, PRICE_TIER_TOOLTIPS } from '../types/restaurant';
import type { PriceTier, Restaurant } from '../types/restaurant';
import { Tooltip } from './Tooltip';

const PRICE_TIERS: PriceTier[] = [1, 2, 3, 4];

type FormData = Omit<Restaurant, 'id' | 'added_at'>;

const EMPTY: FormData = {
  name: '',
  address: '',
  lat: 0,
  lng: 0,
  cuisine: '',
  price_tier: 2,
  tabelog_rating: 0,
  personal_rating: null,
  tabelog_url: '',
  awards: [],
  tags: [],
  notes: '',
  visited: false,
  scraped_at: new Date().toISOString(),
};

interface Props {
  allCuisines: string[];
  allTags: string[];
  onSubmit: (data: FormData) => void;
  onClose: () => void;
}

export function AddRestaurantForm({ allCuisines, allTags, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'address_lookup', string>>>(
    {},
  );
  const [geocoding, setGeocoding] = useState(false);
  const [geocoded, setGeocoded] = useState(false);

  async function geocodeAddress() {
    const q = form.address.trim();
    if (!q) return;
    setGeocoding(true);
    setErrors((e) => ({ ...e, address_lookup: undefined }));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'Accept-Language': 'ja,en' } },
      );
      const data = await res.json();
      if (data.length === 0) {
        setErrors((e) => ({ ...e, address_lookup: 'Address not found — try adding city name' }));
      } else {
        setForm((f) => ({ ...f, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
        setGeocoded(true);
      }
    } catch {
      setErrors((e) => ({ ...e, address_lookup: 'Geocoding failed — check connection' }));
    } finally {
      setGeocoding(false);
    }
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.cuisine.trim()) e.cuisine = 'Required';
    if (!geocoded && form.lat === 0 && form.lng === 0)
      e.address_lookup = 'Look up coordinates first';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function addTag(tag: string) {
    const t = tag.trim();
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 2000 }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Add Restaurant</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Name" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={input(errors.name)}
            />
          </Field>

          <Field label="Address" error={errors.address}>
            <div className="flex gap-2">
              <input
                value={form.address}
                onChange={(e) => {
                  setForm((f) => ({ ...f, address: e.target.value }));
                  setGeocoded(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), geocodeAddress())}
                placeholder="e.g. 1-2-3 Shibuya, Tokyo"
                className={`flex-1 ${input(errors.address)}`}
              />
              <button
                type="button"
                onClick={geocodeAddress}
                disabled={geocoding}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 shrink-0"
              >
                {geocoding ? '…' : geocoded ? '✓' : 'Look up'}
              </button>
            </div>
            {errors.address_lookup && (
              <p className="text-xs text-red-500 mt-0.5">{errors.address_lookup}</p>
            )}
            {geocoded && (
              <p className="text-xs text-green-600 mt-0.5">
                Located at {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
              </p>
            )}
          </Field>

          <Field label="Cuisine" error={errors.cuisine}>
            <input
              value={form.cuisine}
              onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
              list="cuisine-list"
              className={input(errors.cuisine)}
            />
            <datalist id="cuisine-list">
              {allCuisines.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field label="Price">
            <div className="flex gap-2">
              {PRICE_TIERS.map((value) => (
                <Tooltip key={value} text={PRICE_TIER_TOOLTIPS[value]}>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, price_tier: value }))}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors shrink-0 ${form.price_tier === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
                  >
                    {PRICE_TIER_LABELS[value]}
                  </button>
                </Tooltip>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tabelog Rating">
              <input
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={form.tabelog_rating || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tabelog_rating: parseFloat(e.target.value) || 0 }))
                }
                className={input()}
              />
            </Field>
            <Field label="Tabelog URL">
              <input
                value={form.tabelog_url}
                onChange={(e) => setForm((f) => ({ ...f, tabelog_url: e.target.value }))}
                className={input()}
              />
            </Field>
          </div>

          <Field label="Tags">
            <div className="flex flex-wrap gap-1 mb-2">
              {form.tags.map((t: string) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, tags: f.tags.filter((x: string) => x !== t) }))
                    }
                    className="text-blue-400 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                placeholder="Add tag..."
                list="tags-list"
                className={input()}
              />
              <datalist id="tags-list">
                {allTags
                  .filter((t) => !form.tags.includes(t))
                  .map((t) => (
                    <option key={t} value={t} />
                  ))}
              </datalist>
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Add
              </button>
            </div>
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className={`${input()} resize-none`}
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Restaurant
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function input(error?: string) {
  return `w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`;
}
