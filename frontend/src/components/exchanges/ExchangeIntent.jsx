import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { profileApi } from '../../api/profile';
import { AlertTriangle } from 'lucide-react';

/**
 * ExchangeIntent - Choose exchange type (Audio Call for now)
 * Note: Already wrapped by PageContainer in ExchangesPage
 */
const ExchangeIntent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [eligibleCategories, setEligibleCategories] = useState([]);

  // Selection State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTeachId, setSelectedTeachId] = useState('');
  const [selectedLearnId, setSelectedLearnId] = useState('');

  const computeEligibleCategories = (allSkills) => {
    // 1. Group skills by category
    const catMap = allSkills.reduce((acc, s) => {
      // Handle nested skill object structure (s.skill.category or s.category)
      // Based on API, it's likely s.skill.category
      const category = s.skill?.category || s.category || 'Other';
      if (!acc[category]) acc[category] = { teach: 0, learn: 0 };

      if (s.type === 'TEACH') acc[category].teach++;
      if (s.type === 'LEARN') acc[category].learn++;

      return acc;
    }, {});

    // 2. Filter for valid categories (Has >= 1 Teach AND >= 1 Learn)
    const eligible = Object.keys(catMap).filter(cat =>
      catMap[cat].teach > 0 && catMap[cat].learn > 0
    );

    setEligibleCategories(eligible);
  };

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const { data } = await profileApi.getUserSkills();
        setSkills(data);
        computeEligibleCategories(data);
      } catch (err) {
        console.error("Failed to load skills", err);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, []);

  const handleStartExchange = () => {
    if (!selectedCategory || !selectedTeachId || !selectedLearnId) return;

    // Validation is now handled by getValidationError() disable state
    // But double check here just in case
    const error = getValidationError();
    if (error) return;

    navigate('/exchanges/matching', {
      state: {
        intent: 'AUDIO_CALL', // Default intent
        category: selectedCategory,
        teachSkillId: parseInt(selectedTeachId),
        learnSkillId: parseInt(selectedLearnId)
      },
    });
  };

  // Filter skills for dropdowns based on selection
  const availableTeachSkills = skills.filter(s =>
    (s.skill?.category || s.category) === selectedCategory && s.type === 'TEACH'
  );

  const availableLearnSkills = skills.filter(s =>
    (s.skill?.category || s.category) === selectedCategory && s.type === 'LEARN'
  );

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading your skills...</div>;
  }

  // 🔴 UX GUARDRAIL: No eligible categories
  if (eligibleCategories.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-6">
        <div className="p-8 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-xl border border-red-200 dark:border-red-800">
          <h2 className="text-xl font-bold mb-2">Setup Required</h2>
          <p>
            To start an exchange, you need to be able to <strong>Teach</strong> and <strong>Learn</strong> within the same category.
          </p>
          <div className="mt-4">
            <Button onClick={() => navigate('/profile')}>
              Go to Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Validation Logic
  const getValidationError = () => {
    if (!selectedTeachId || !selectedLearnId) return null;

    const cat = (selectedCategory || '').toLowerCase();
    const isLanguage = cat === 'languages' || cat === 'language';

    if (selectedTeachId === selectedLearnId && !isLanguage) {
      return 'You cannot teach and learn the same skill in this category. This is only allowed for Languages.';
    }
    return null;
  };

  const validationError = getValidationError();

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
          Start an Exchange
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Select a category and choose the skills you want to exchange.
        </p>
      </div>

      <Card className="p-6 space-y-6">

        {/* 1. Category Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Topic Category
          </label>
          <select
            className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedTeachId('');
              setSelectedLearnId('');
            }}
          >
            <option value="">Select a category...</option>
            {eligibleCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* 2. Skill Selection (Only visible if category selected) */}
        {selectedCategory && (
          <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">

            {/* Teach Skill */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-green-600 dark:text-green-400">
                You will Teach
              </label>
              <select
                className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                value={selectedTeachId}
                onChange={(e) => setSelectedTeachId(e.target.value)}
              >
                <option value="">Select skill...</option>
                {availableTeachSkills.map(s => {
                  const skillName = s.skillName || s.skill?.name || s.skill || 'Unnamed Skill';
                  const skillId = s.skill?.id || s.skillId || s.id;
                  return <option key={s.id} value={skillId}>{skillName}</option>;
                })}
              </select>
            </div>

            {/* Learn Skill */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-600 dark:text-blue-400">
                You will Learn
              </label>
              <select
                className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                value={selectedLearnId}
                onChange={(e) => setSelectedLearnId(e.target.value)}
              >
                <option value="">Select skill...</option>
                {availableLearnSkills.map(s => {
                  const skillName = s.skillName || s.skill?.name || s.skill || 'Unnamed Skill';
                  const skillId = s.skill?.id || s.skillId || s.id;
                  return <option key={s.id} value={skillId}>{skillName}</option>;
                })}
              </select>
            </div>
          </div>
        )}

        {/* Validation Warning */}
        {validationError && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded-md border border-amber-200 dark:border-amber-800 animate-in fade-in zoom-in-95 duration-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" /> {validationError}
          </div>
        )}

        {/* 3. Action Button */}
        <Button
          onClick={handleStartExchange}
          disabled={!selectedCategory || !selectedTeachId || !selectedLearnId || !!validationError}
          className="w-full"
          variant={(!selectedCategory || !selectedTeachId || !selectedLearnId || !!validationError) ? 'secondary' : 'primary'}
        >
          Find Partner
        </Button>

      </Card>
    </div>
  );
};

export default ExchangeIntent;
