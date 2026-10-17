type Meal = {
  id: string;
  name: string;
  details: string;
  calories: number;
  protein: number;
  date: string;
  mealType: string;
};
type PantryItem = {
  id: string;
  name: string;
  quantity: string;
  category: string;
  expiry: string;
};
type WeightEntry = { id: string; weight: number; date: string; note: string };
type TrackerData = { meals: Meal[]; pantry: PantryItem[]; weights: WeightEntry[] };

const STORAGE_KEY = 'my-meal-tracker-data';
const emptyData: TrackerData = { meals: [], pantry: [], weights: [] };

function readData(): TrackerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyData };
    const parsed = JSON.parse(raw) as Partial<TrackerData>;
    return {
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
      pantry: Array.isArray(parsed.pantry) ? parsed.pantry : [],
      weights: Array.isArray(parsed.weights) ? parsed.weights : [],
    };
  } catch {
    return { ...emptyData };
  }
}

function writeData(data: TrackerData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function coachReply(body: { prompt?: string; pantry?: string[]; meals?: string[] }) {
  const pantry = (body.pantry || []).filter(Boolean).slice(0, 8);
  const meals = (body.meals || []).filter(Boolean).slice(0, 5);
  const context = pantry.length
    ? `You could start with what you have: ${pantry.join(', ')}. `
    : 'Choose ingredients that are convenient and available to you. ';
  const logged = meals.length
    ? `You have logged ${meals.join(', ')} today. `
    : 'You have not logged any meals today yet. ';
  return `${context}${logged}For a satisfying meal, consider combining a source of protein, vegetables or fruit, and a carbohydrate you enjoy. Your question was: “${(body.prompt || '').trim().slice(0, 240)}”. This built-in coach provides general suggestions; it is not a connected generative AI service.`;
}

export const api = {
  async get(path: string) {
    if (path !== '/api/data') throw new Error('Unsupported local API route.');
    return { data: readData() };
  },
  async post(path: string, body: Record<string, unknown>) {
    const data = readData();
    const id = makeId();
    if (path === '/api/meals') {
      data.meals.unshift({
        id,
        name: String(body.name || ''),
        details: String(body.details || ''),
        calories: Number(body.calories) || 0,
        protein: Number(body.protein) || 0,
        date: String(body.date || new Date().toISOString().slice(0, 10)),
        mealType: String(body.mealType || 'Meal'),
      });
      writeData(data);
      return { data: { id } };
    }
    if (path === '/api/pantry') {
      data.pantry.unshift({
        id,
        name: String(body.name || ''),
        quantity: String(body.quantity || ''),
        category: String(body.category || 'Other'),
        expiry: String(body.expiry || ''),
      });
      writeData(data);
      return { data: { id } };
    }
    if (path === '/api/weights') {
      data.weights.unshift({
        id,
        weight: Number(body.weight) || 0,
        date: String(body.date || new Date().toISOString().slice(0, 10)),
        note: String(body.note || ''),
      });
      writeData(data);
      return { data: { id } };
    }
    if (path === '/api/coach') {
      return {
        data: {
          text: coachReply({
            prompt: String(body.prompt || ''),
            pantry: Array.isArray(body.pantry) ? body.pantry.filter((v): v is string => typeof v === 'string') : [],
            meals: Array.isArray(body.meals) ? body.meals.filter((v): v is string => typeof v === 'string') : [],
          }),
        },
      };
    }
    throw new Error('Unsupported local API route.');
  },
  async delete(path: string) {
    const match = path.match(/^\/api\/(meals|pantry|weights)\/([^/]+)$/);
    if (!match) throw new Error('Unsupported local API route.');
    const [, kind, encodedId] = match;
    const id = decodeURIComponent(encodedId);
    const data = readData();
    if (kind === 'meals') data.meals = data.meals.filter(item => item.id !== id);
    if (kind === 'pantry') data.pantry = data.pantry.filter(item => item.id !== id);
    if (kind === 'weights') data.weights = data.weights.filter(item => item.id !== id);
    writeData(data);
    return { data: { deleted: true } };
  },
};
