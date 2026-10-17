import { router, json, error, db, ai } from '@appdeploy/sdk';

type Meal = {
  id?: string;
  name: string;
  details?: string;
  calories?: number;
  protein?: number;
  date: string;
  mealType: string;
};
type PantryItem = {
  id?: string;
  name: string;
  quantity: string;
  category: string;
  expiry?: string;
};
type WeightEntry = { id?: string; weight: number; date: string; note?: string };
const MEALS = 'meal_entries';
const PANTRY = 'pantry_items';
const WEIGHTS = 'weight_entries';
const safeText = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';
const fail = (message: string) => error(message, 400);

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  'GET /api/data': [
    async () => {
      const [meals, pantry, weights] = await Promise.all([
        db.list<Meal>(MEALS, { limit: 100 }),
        db.list<PantryItem>(PANTRY, { limit: 100 }),
        db.list<WeightEntry>(WEIGHTS, { limit: 100 }),
      ]);
      return json({
        meals: meals.items,
        pantry: pantry.items,
        weights: weights.items,
      });
    },
  ],
  'POST /api/meals': [
    async ({ body }) => {
      const value = body as Partial<Meal>;
      const name = safeText(value.name, 120);
      const date = safeText(value.date, 10);
      if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(date))
        return fail('A meal name and valid date are required.');
      const calories = Number(value.calories ?? 0);
      const protein = Number(value.protein ?? 0);
      if (
        !Number.isFinite(calories) ||
        calories < 0 ||
        !Number.isFinite(protein) ||
        protein < 0
      )
        return fail('Nutrition values must be non-negative numbers.');
      const [id] = await db.add(MEALS, [
        {
          name,
          details: safeText(value.details),
          calories,
          protein,
          date,
          mealType: safeText(value.mealType, 30) || 'Meal',
        },
      ]);
      if (!id) return error('Could not save meal.', 500);
      return json({ id, name });
    },
  ],
  'POST /api/pantry': [
    async ({ body }) => {
      const value = body as Partial<PantryItem>;
      const name = safeText(value.name, 120);
      const quantity = safeText(value.quantity, 100);
      if (!name || !quantity)
        return fail('Item name and quantity are required.');
      const [id] = await db.add(PANTRY, [
        {
          name,
          quantity,
          category: safeText(value.category, 50) || 'Other',
          expiry: safeText(value.expiry, 10),
        },
      ]);
      if (!id) return error('Could not save pantry item.', 500);
      return json({ id, name });
    },
  ],
  'POST /api/weights': [
    async ({ body }) => {
      const value = body as Partial<WeightEntry>;
      const weight = Number(value.weight);
      const date = safeText(value.date, 10);
      if (
        !Number.isFinite(weight) ||
        weight <= 0 ||
        weight > 1000 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      )
        return fail('Enter a valid weight and date.');
      const [id] = await db.add(WEIGHTS, [
        { weight, date, note: safeText(value.note, 240) },
      ]);
      if (!id) return error('Could not save weight entry.', 500);
      return json({ id, date });
    },
  ],
  'DELETE /api/meals/:id': [
    async ({ params }) => {
      const [ok] = await db.delete(MEALS, [params.id]);
      return ok ? json({ deleted: true }) : error('Meal not found.', 404);
    },
  ],
  'DELETE /api/pantry/:id': [
    async ({ params }) => {
      const [ok] = await db.delete(PANTRY, [params.id]);
      return ok
        ? json({ deleted: true })
        : error('Pantry item not found.', 404);
    },
  ],
  'DELETE /api/weights/:id': [
    async ({ params }) => {
      const [ok] = await db.delete(WEIGHTS, [params.id]);
      return ok
        ? json({ deleted: true })
        : error('Weight entry not found.', 404);
    },
  ],
  'POST /api/coach': [
    async ({ body }) => {
      const value = body as {
        prompt?: unknown;
        pantry?: unknown;
        meals?: unknown;
      };
      const prompt = safeText(value.prompt, 1500);
      if (!prompt) return fail('Please enter a question first.');
      const pantry = Array.isArray(value.pantry)
        ? value.pantry
            .filter((item): item is string => typeof item === 'string')
            .slice(0, 40)
        : [];
      const meals = Array.isArray(value.meals)
        ? value.meals
            .filter((item): item is string => typeof item === 'string')
            .slice(0, 20)
        : [];
      try {
        const result = await ai.generate({
          system:
            'You are a supportive, non-judgmental food and meal planning helper. Give practical, culturally flexible meal ideas. Avoid restrictive dieting, calorie targets, weight-loss pressure, medical diagnoses, and moralizing foods. Do not infer medical needs. If asked for medical nutrition advice, encourage consulting a qualified clinician or dietitian. Keep answers concise and warm.',
          prompt:
            'User question: ' +
            prompt +
            '\nPantry items: ' +
            (pantry.join(', ') || 'not provided') +
            '\nMeals logged today: ' +
            (meals.join(', ') || 'none logged') +
            '\nOffer helpful general information and one practical next step.',
          maxTokens: 500,
          temperature: 0.6,
        });
        return json({ text: result.text });
      } catch (err) {
        console.error('AI coach request failed', err);
        return error(
          'The AI coach is temporarily unavailable. Please try again.',
          502
        );
      }
    },
  ],
});
