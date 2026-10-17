import { useEffect, useMemo, useState } from 'react';
import { api } from './lib/api';
import {
  Activity,
  Apple,
  ArrowDownRight,
  ArrowUpRight,
  ChefHat,
  CircleHelp,
  ClipboardList,
  Leaf,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';

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
type AppData = { meals: Meal[]; pantry: PantryItem[]; weights: WeightEntry[] };
const today = new Date().toISOString().slice(0, 10);
const emptyData: AppData = { meals: [], pantry: [], weights: [] };

function App() {
  const [data, setData] = useState<AppData>(emptyData);
  const [section, setSection] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<'meal' | 'pantry' | 'weight' | null>(null);
  const [meal, setMeal] = useState({
    name: '',
    details: '',
    calories: '',
    protein: '',
    mealType: 'Lunch',
  });
  const [pantry, setPantry] = useState({
    name: '',
    quantity: '',
    category: 'Produce',
    expiry: '',
  });
  const [weight, setWeight] = useState({ weight: '', date: today, note: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  async function refresh() {
    try {
      const result = await api.get('/api/data');
      setData({
        meals: result.data.meals || [],
        pantry: result.data.pantry || [],
        weights: result.data.weights || [],
      });
    } catch {
      setNotice(
        'Could not load your tracker right now. Please try refreshing.'
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const dayMeals = useMemo(
    () => data.meals.filter(item => item.date === today),
    [data.meals]
  );
  const calories = dayMeals.reduce(
    (sum, item) => sum + (Number(item.calories) || 0),
    0
  );
  const protein = dayMeals.reduce(
    (sum, item) => sum + (Number(item.protein) || 0),
    0
  );
  const latestWeight = [...data.weights].sort((a, b) =>
    b.date.localeCompare(a.date)
  )[0];
  const previousWeight = [...data.weights].sort((a, b) =>
    b.date.localeCompare(a.date)
  )[1];
  const weightDelta =
    latestWeight && previousWeight
      ? Number((latestWeight.weight - previousWeight.weight).toFixed(1))
      : null;

  async function save(kind: 'meal' | 'pantry' | 'weight') {
    try {
      if (kind === 'meal') {
        if (!meal.name.trim()) {
          setNotice('Add a meal name before saving.');
          return;
        }
        await api.post('/api/meals', {
          ...meal,
          calories: Number(meal.calories) || 0,
          protein: Number(meal.protein) || 0,
          date: today,
        });
      } else if (kind === 'pantry') {
        if (!pantry.name.trim() || !pantry.quantity.trim()) {
          setNotice('Add an item name and quantity.');
          return;
        }
        await api.post('/api/pantry', pantry);
      } else {
        const amount = Number(weight.weight);
        if (!Number.isFinite(amount) || amount <= 0 || !weight.date) {
          setNotice('Enter a valid weight and date.');
          return;
        }
        await api.post('/api/weights', { ...weight, weight: amount });
      }
      setModal(null);
      setNotice('Saved successfully.');
      await refresh();
    } catch {
      setNotice('Could not save this entry. Please try again.');
    }
  }
  async function remove(kind: 'meals' | 'pantry' | 'weights', id: string) {
    try {
      await api.delete('/api/' + kind + '/' + encodeURIComponent(id));
      setNotice('Entry removed.');
      await refresh();
    } catch {
      setNotice('Could not remove that entry. Please try again.');
    }
  }
  async function askAI(event: React.FormEvent) {
    event.preventDefault();
    if (!aiPrompt.trim()) {
      setNotice('Write a question or describe a meal first.');
      return;
    }
    setAiLoading(true);
    setAiResult('');
    try {
      const result = await api.post('/api/coach', {
        prompt: aiPrompt,
        pantry: data.pantry.map(item => item.name),
        meals: dayMeals.map(item => item.name),
      });
      setAiResult(
        result.data.text ||
          'Try adding a balanced source of protein, vegetables or fruit, and a satisfying carbohydrate.'
      );
    } catch {
      setAiResult(
        'Your coach is unavailable right now. Try again in a moment.'
      );
    } finally {
      setAiLoading(false);
    }
  }

  const nav = [
    { label: 'Overview', icon: Activity },
    { label: 'Food diary', icon: ClipboardList },
    { label: 'My pantry', icon: Apple },
    { label: 'Weight log', icon: Scale },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Leaf size={22} />
          </div>
          <div>
            <strong>
              My Meal Tracker<span>.</span>
            </strong>
            <small>YOUR DAILY WELLNESS</small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(item => (
            <button
              key={item.label}
              className={'nav-item ' + (section === item.label ? 'active' : '')}
              onClick={() => setSection(item.label)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.label === 'My pantry' && data.pantry.length > 0 && (
                <em>{data.pantry.length}</em>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-icon">
            <Sparkles size={18} />
          </div>
          <strong>A little better, every day.</strong>
          <p>
            Small, steady habits add up. Focus on feeling good, not being
            perfect.
          </p>
          <button
            className="text-button"
            onClick={() => setSection('Overview')}
          >
            Back to today <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="profile">
          <div className="avatar">N</div>
          <div>
            <strong>My wellness space</strong>
            <small>Personal tracker</small>
          </div>
          <CircleHelp size={17} className="muted-icon" />
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <Leaf size={21} />
            <strong>
              My Meal Tracker<span>.</span>
            </strong>
          </div>
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{section}</strong>
          </div>
          <div className="top-right">
            <span className="date-pill">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <div className="top-avatar">N</div>
          </div>
        </header>
        <div className="page-wrap">
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                onClick={() => setNotice('')}
                aria-label="Dismiss message"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {section === 'Overview' && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" /> YOUR WELLNESS, YOUR WAY
                  </div>
                  <h1>
                    Make room for <span>wellness.</span>
                  </h1>
                  <p className="subtitle">
                    A gentle look at your food, pantry, and progress — all in
                    one place.
                  </p>
                </div>
                <div className="welcome-art">
                  <div className="art-circle">
                    <Apple size={39} />
                  </div>
                  <span className="art-leaf leaf-one">✳</span>
                  <span className="art-leaf leaf-two">✦</span>
                </div>
              </section>
              <section className="stats-grid">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Meals today</span>
                    <div className="stat-icon peach">
                      <Utensils size={18} />
                    </div>
                  </div>
                  <div className="stat-number">
                    {dayMeals.length}
                    <small> meals logged</small>
                  </div>
                  <div className="stat-foot">
                    <span className="green-dot" /> Keep checking in with
                    yourself
                  </div>
                </article>
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Energy logged</span>
                    <div className="stat-icon yellow">
                      <Sparkles size={18} />
                    </div>
                  </div>
                  <div className="stat-number">
                    {calories.toLocaleString()}
                    <small> kcal estimated</small>
                  </div>
                  <div className="stat-foot">
                    An estimate, not a target to chase
                  </div>
                </article>
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Pantry staples</span>
                    <div className="stat-icon green">
                      <Apple size={18} />
                    </div>
                  </div>
                  <div className="stat-number">
                    {data.pantry.length}
                    <small> items on hand</small>
                  </div>
                  <div className="stat-foot">
                    {data.pantry.length
                      ? 'Your kitchen, at a glance'
                      : 'Add what you have at home'}
                  </div>
                </article>
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Latest weight</span>
                    <div className="stat-icon lavender">
                      <Scale size={18} />
                    </div>
                  </div>
                  <div className="stat-number">
                    {latestWeight ? latestWeight.weight : '—'}
                    <small>
                      {latestWeight ? ' kg · latest entry' : ' no entry yet'}
                    </small>
                  </div>
                  <div className="stat-foot">
                    {weightDelta === null ? (
                      'Every body changes naturally'
                    ) : (
                      <>
                        {weightDelta > 0 ? (
                          <ArrowUpRight size={14} />
                        ) : weightDelta < 0 ? (
                          <ArrowDownRight size={14} />
                        ) : null}{' '}
                        {weightDelta > 0 ? '+' : ''}
                        {weightDelta} kg since previous log
                      </>
                    )}
                  </div>
                </article>
              </section>
              <section className="content-grid">
                <article className="panel diary-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="eyebrow">YOUR DAY</div>
                      <h2>Food diary</h2>
                    </div>
                    <button
                      className="link-button"
                      onClick={() => setSection('Food diary')}
                    >
                      View diary <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {loading ? (
                    <div className="empty-state">Loading your day…</div>
                  ) : dayMeals.length ? (
                    <div className="meal-list">
                      {dayMeals.slice(0, 4).map(item => (
                        <div className="meal-row" key={item.id}>
                          <div className="meal-symbol">
                            <Utensils size={18} />
                          </div>
                          <div className="meal-info">
                            <strong>{item.name}</strong>
                            <span>
                              {item.mealType} ·{' '}
                              {item.details || 'No notes added'}
                            </span>
                          </div>
                          <div className="meal-cal">
                            {item.calories || '—'}
                            <small>kcal</small>
                          </div>
                          <button
                            className="icon-button"
                            onClick={() => remove('meals', item.id)}
                            aria-label={'Remove ' + item.name}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-illustration">
                        <ChefHat size={26} />
                      </div>
                      <strong>Your diary starts here</strong>
                      <p>
                        Log a meal or snack to keep a gentle record of your day.
                      </p>
                      <button
                        className="primary-button small"
                        onClick={() => setModal('meal')}
                      >
                        <Plus size={15} /> Log a meal
                      </button>
                    </div>
                  )}
                  <button
                    className="wide-add"
                    onClick={() => {
                      setMeal({
                        name: '',
                        details: '',
                        calories: '',
                        protein: '',
                        mealType: 'Lunch',
                      });
                      setModal('meal');
                    }}
                  >
                    <Plus size={16} /> Add a meal or snack
                  </button>
                </article>
                <article className="panel coach-panel">
                  <div className="coach-head">
                    <div className="coach-icon">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div className="eyebrow">YOUR PERSONAL HELPER</div>
                      <h2>AI food coach</h2>
                    </div>
                    <span className="beta-tag">AI</span>
                  </div>
                  <p className="coach-description">
                    Ideas for balanced meals, simple swaps, and using what is
                    already in your kitchen.
                  </p>
                  <div className="suggestion-chips">
                    <button
                      onClick={() =>
                        setAiPrompt(
                          'Suggest a balanced meal using everyday ingredients.'
                        )
                      }
                    >
                      Balanced meal ideas
                    </button>
                    <button
                      onClick={() =>
                        setAiPrompt(
                          'Help me use ingredients I already have in my pantry.'
                        )
                      }
                    >
                      Use my pantry
                    </button>
                  </div>
                  <form onSubmit={askAI} className="coach-form">
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="Ask about a meal, ingredient, or nutrition…"
                    />
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={aiLoading}
                    >
                      {aiLoading ? (
                        'Thinking…'
                      ) : (
                        <>
                          <Sparkles size={16} /> Ask your coach
                        </>
                      )}
                    </button>
                  </form>
                  {aiResult && (
                    <div className="ai-result" role="status">
                      <strong>Here's an idea for you</strong>
                      <p>{aiResult}</p>
                    </div>
                  )}
                  <div className="coach-disclaimer">
                    Helpful ideas, not medical advice or a substitute for a
                    dietitian.
                  </div>
                </article>
              </section>
              <section className="quick-actions">
                <div>
                  <div className="eyebrow">KEEP IT SIMPLE</div>
                  <h2>What would you like to do?</h2>
                </div>
                <div className="action-buttons">
                  <button onClick={() => setModal('meal')}>
                    <span className="action-icon peach">
                      <Utensils size={18} />
                    </span>
                    <span>
                      <strong>Log a meal</strong>
                      <small>Record what you ate</small>
                    </span>
                    <Plus size={17} />
                  </button>
                  <button onClick={() => setModal('pantry')}>
                    <span className="action-icon green">
                      <Apple size={18} />
                    </span>
                    <span>
                      <strong>Add pantry item</strong>
                      <small>Keep track of staples</small>
                    </span>
                    <Plus size={17} />
                  </button>
                  <button onClick={() => setModal('weight')}>
                    <span className="action-icon lavender">
                      <Scale size={18} />
                    </span>
                    <span>
                      <strong>Log weight</strong>
                      <small>Record a check-in</small>
                    </span>
                    <Plus size={17} />
                  </button>
                </div>
              </section>
            </>
          )}
          {section === 'Food diary' && (
            <section className="section-page">
              <div className="section-title">
                <div>
                  <div className="eyebrow">YOUR MEAL TRACKER</div>
                  <h1>Food diary</h1>
                  <p className="subtitle">
                    Keep a record of meals and snacks without judgment.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setModal('meal')}
                >
                  <Plus size={16} /> Log a meal
                </button>
              </div>
              <div className="panel full-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Today's entries</h2>
                    <p className="panel-sub">
                      {dayMeals.length} meals · {calories.toLocaleString()}{' '}
                      estimated kcal · {protein}g protein logged
                    </p>
                  </div>
                </div>
                {dayMeals.length ? (
                  <div className="meal-list">
                    {dayMeals.map(item => (
                      <div className="meal-row" key={item.id}>
                        <div className="meal-symbol">
                          <Utensils size={18} />
                        </div>
                        <div className="meal-info">
                          <strong>{item.name}</strong>
                          <span>
                            {item.mealType} · {item.details || 'No notes added'}
                          </span>
                        </div>
                        <div className="meal-cal">
                          {item.calories || '—'}
                          <small>kcal</small>
                        </div>
                        <button
                          className="icon-button"
                          onClick={() => remove('meals', item.id)}
                          aria-label={'Remove ' + item.name}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-illustration">
                      <ClipboardList size={26} />
                    </div>
                    <strong>No meals logged today</strong>
                    <p>
                      Start with whatever you have eaten. There's no perfect way
                      to do this.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
          {section === 'My pantry' && (
            <section className="section-page">
              <div className="section-title">
                <div>
                  <div className="eyebrow">WHAT'S IN YOUR KITCHEN</div>
                  <h1>My pantry</h1>
                  <p className="subtitle">
                    Know what you have and make everyday meals easier.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setModal('pantry')}
                >
                  <Plus size={16} /> Add item
                </button>
              </div>
              <div className="pantry-grid">
                {data.pantry.map(item => (
                  <article className="pantry-card" key={item.id}>
                    <div className="pantry-symbol">
                      <Apple size={21} />
                    </div>
                    <div className="pantry-card-top">
                      <span className="category-tag">{item.category}</span>
                      <button
                        className="icon-button"
                        onClick={() => remove('pantry', item.id)}
                        aria-label={'Remove ' + item.name}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.quantity}</p>
                    {item.expiry && <small>Best before {item.expiry}</small>}
                  </article>
                ))}
                {!data.pantry.length && (
                  <div className="panel full-panel empty-state">
                    <div className="empty-illustration">
                      <Apple size={26} />
                    </div>
                    <strong>Your pantry is waiting</strong>
                    <p>
                      Add ingredients and staples you have at home. Your AI
                      coach can use this list for meal ideas.
                    </p>
                    <button
                      className="primary-button small"
                      onClick={() => setModal('pantry')}
                    >
                      <Plus size={15} /> Add first item
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
          {section === 'Weight log' && (
            <section className="section-page">
              <div className="section-title">
                <div>
                  <div className="eyebrow">CHECK IN WITH YOURSELF</div>
                  <h1>Weight log</h1>
                  <p className="subtitle">
                    A private record of your check-ins. Your worth is never a
                    number.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setModal('weight')}
                >
                  <Plus size={16} /> Log weight
                </button>
              </div>
              <div className="weight-summary">
                <div className="panel weight-feature">
                  <div className="stat-icon lavender">
                    <Scale size={20} />
                  </div>
                  <div className="eyebrow">MOST RECENT ENTRY</div>
                  <div className="weight-big">
                    {latestWeight
                      ? latestWeight.weight + ' kg'
                      : 'No entry yet'}
                  </div>
                  <p>
                    {latestWeight
                      ? new Date(
                          latestWeight.date + 'T12:00:00'
                        ).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Add a check-in whenever it feels useful.'}
                  </p>
                  <span className="soft-note">
                    Weight naturally fluctuates. Trends are only one small part
                    of wellbeing.
                  </span>
                </div>
                <div className="panel history-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Check-in history</h2>
                      <p className="panel-sub">
                        Your saved entries, newest first
                      </p>
                    </div>
                  </div>
                  {[...data.weights]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(item => (
                      <div className="weight-row" key={item.id}>
                        <div className="history-dot">
                          <Scale size={16} />
                        </div>
                        <div className="weight-info">
                          <strong>{item.weight} kg</strong>
                          <span>
                            {new Date(
                              item.date + 'T12:00:00'
                            ).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {item.note ? ' · ' + item.note : ''}
                          </span>
                        </div>
                        <button
                          className="icon-button"
                          onClick={() => remove('weights', item.id)}
                          aria-label="Remove weight entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  {!data.weights.length && (
                    <div className="empty-state compact">
                      Your check-ins will appear here when you add them.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
          <footer className="footer">
            <span>
              Made for a kinder relationship with food.{' '}
              <span className="footer-heart">♥</span>
            </span>
            <span>Take what helps. Leave what doesn't.</span>
          </footer>
        </div>
      </main>
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-head">
              <div>
                <div className="eyebrow">YOUR TRACKER</div>
                <h2>
                  {modal === 'meal'
                    ? 'Log a meal'
                    : modal === 'pantry'
                      ? 'Add pantry item'
                      : 'Log a check-in'}
                </h2>
              </div>
              <button
                className="icon-button close-button"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>
            {modal === 'meal' && (
              <form
                className="entry-form"
                onSubmit={e => {
                  e.preventDefault();
                  void save('meal');
                }}
              >
                <label>
                  Meal or snack name
                  <input
                    autoFocus
                    value={meal.name}
                    onChange={e => setMeal({ ...meal, name: e.target.value })}
                    placeholder="e.g. Rice and beans"
                    required
                  />
                </label>
                <label>
                  Meal type
                  <select
                    value={meal.mealType}
                    onChange={e =>
                      setMeal({ ...meal, mealType: e.target.value })
                    }
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                  </select>
                </label>
                <label>
                  Notes or ingredients
                  <textarea
                    value={meal.details}
                    onChange={e =>
                      setMeal({ ...meal, details: e.target.value })
                    }
                    placeholder="What was in it? (optional)"
                  />
                </label>
                <div className="form-two">
                  <label>
                    Estimated energy (kcal)
                    <input
                      type="number"
                      min="0"
                      value={meal.calories}
                      onChange={e =>
                        setMeal({ ...meal, calories: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </label>
                  <label>
                    Protein (g)
                    <input
                      type="number"
                      min="0"
                      value={meal.protein}
                      onChange={e =>
                        setMeal({ ...meal, protein: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>
                <button className="primary-button submit-button" type="submit">
                  Save meal
                </button>
                <p className="form-note">
                  Nutrition values are optional estimates, not goals.
                </p>
              </form>
            )}
            {modal === 'pantry' && (
              <form
                className="entry-form"
                onSubmit={e => {
                  e.preventDefault();
                  void save('pantry');
                }}
              >
                <label>
                  Item name
                  <input
                    autoFocus
                    value={pantry.name}
                    onChange={e =>
                      setPantry({ ...pantry, name: e.target.value })
                    }
                    placeholder="e.g. Oats"
                    required
                  />
                </label>
                <label>
                  Quantity
                  <input
                    value={pantry.quantity}
                    onChange={e =>
                      setPantry({ ...pantry, quantity: e.target.value })
                    }
                    placeholder="e.g. 1 bag, half a carton"
                    required
                  />
                </label>
                <label>
                  Category
                  <select
                    value={pantry.category}
                    onChange={e =>
                      setPantry({ ...pantry, category: e.target.value })
                    }
                  >
                    {[
                      'Produce',
                      'Grains & bread',
                      'Protein',
                      'Dairy & alternatives',
                      'Canned & dry goods',
                      'Spices & sauces',
                      'Other',
                    ].map(item => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Best before (optional)
                  <input
                    type="date"
                    value={pantry.expiry}
                    onChange={e =>
                      setPantry({ ...pantry, expiry: e.target.value })
                    }
                  />
                </label>
                <button className="primary-button submit-button" type="submit">
                  Add to pantry
                </button>
              </form>
            )}
            {modal === 'weight' && (
              <form
                className="entry-form"
                onSubmit={e => {
                  e.preventDefault();
                  void save('weight');
                }}
              >
                <div className="gentle-note">
                  <Leaf size={17} />
                  <span>
                    Only log if it feels helpful for you. You can track
                    wellbeing without tracking weight, too.
                  </span>
                </div>
                <label>
                  Weight (kg)
                  <input
                    autoFocus
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weight.weight}
                    onChange={e =>
                      setWeight({ ...weight, weight: e.target.value })
                    }
                    placeholder="Enter your measurement"
                    required
                  />
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    max={today}
                    value={weight.date}
                    onChange={e =>
                      setWeight({ ...weight, date: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Note (optional)
                  <input
                    value={weight.note}
                    onChange={e =>
                      setWeight({ ...weight, note: e.target.value })
                    }
                    placeholder="How are you feeling?"
                  />
                </label>
                <button className="primary-button submit-button" type="submit">
                  Save check-in
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
