import React, { useCallback, useEffect, useState } from 'react';
import { profileApi } from '../../api/profile';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import { useDialog } from '../../context/DialogContext';
import { cn } from '@/lib/utils';
import {
  Code,
  Globe,
  Palette,
  Dumbbell,
  Music,
  Zap,
  Briefcase,
  GraduationCap,
  Star,
  Trash2,
  Edit2,
  Save,
  BookOpen
} from 'lucide-react';

/**
 * SkillsList - Displays user skills with edit and delete functionality
 * 
 * Features:
 * - View skills with type (TEACHING/LEARNING) and level
 * - Inline edit mode for level and type
 * - Optimistic UI updates
 * - Phase 3: Visual Polish & Icon Migration
 */
export const SkillsList = ({ refreshTrigger }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ level: '', skillType: '' });
  const [saving, setSaving] = useState(false);
  const dialog = useDialog();

  const initialLoadDone = React.useRef(false);

  const loadSkills = useCallback(async () => {
    try {
      const { data } = await profileApi.getUserSkills();
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load skills', err);
      if (!initialLoadDone.current) setSkills([]);
    } finally {
      if (!initialLoadDone.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills, refreshTrigger]);

  useLiveRefresh({
    refresh: loadSkills,
    events: ['connection'],
    runOnMount: false,
    minIntervalMs: 5000,
    pollIntervalMs: 30000,
  });

  const handleDelete = async (id) => {
    const ok = await dialog.confirm('Remove Skill', 'Remove this skill?', 'Remove', 'destructive');
    if (!ok) return;

    try {
      await profileApi.deleteUserSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 404) {
        await dialog.alert('Error', 'Failed to delete skill');
      }
    }
  };

  const startEdit = (skill) => {
    setEditingId(skill.id);
    setEditForm({
      level: skill.level || 'BEGINNER',
      skillType: (skill.skillType || skill.type || 'LEARN').toUpperCase()
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ level: '', skillType: '' });
  };

  const handleUpdate = async (id) => {
    if (saving) return;
    setSaving(true);

    try {
      const { data } = await profileApi.updateUserSkill(id, editForm);

      // Update local state with response
      setSkills((prev) => prev.map((s) =>
        s.id === id
          ? { ...s, level: editForm.level, skillType: editForm.skillType, ...data }
          : s
      ));

      setEditingId(null);
      setEditForm({ level: '', skillType: '' });
      setSaving(false);
    } catch (err) {
      console.error('Failed to update skill:', err);
      setSaving(false);
      await dialog.alert('Error', err.response?.data?.message || 'Failed to update skill');
    }
  };

  const getCategoryIcon = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes('dev') || cat.includes('program') || cat.includes('tech')) return <Code className="w-4 h-4 text-blue-500" />;
    if (cat.includes('lang')) return <Globe className="w-4 h-4 text-emerald-500" />;
    if (cat.includes('design') || cat.includes('art')) return <Palette className="w-4 h-4 text-pink-500" />;
    if (cat.includes('music')) return <Music className="w-4 h-4 text-violet-500" />;
    if (cat.includes('sport') || cat.includes('fitness')) return <Dumbbell className="w-4 h-4 text-orange-500" />;
    if (cat.includes('busin') || cat.includes('financ')) return <Briefcase className="w-4 h-4 text-slate-500" />;
    return <Zap className="w-4 h-4 text-amber-500" />;
  };

  const getLevelStars = (level) => {
    let count = 1;
    if (level === 'INTERMEDIATE') count = 2;
    if (level === 'EXPERT') count = 3;

    return (
      <div className="flex gap-0.5" title={`${level} Level`}>
        {[...Array(3)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground animate-pulse">Loading skills…</div>;
  }

  if (!skills.length) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="font-medium text-slate-900 dark:text-slate-200">No skills added yet</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add your first skill to get started!</p>
      </div>
    );
  }

  // Define sort order for proficiency levels
  const levelOrder = { 'EXPERT': 3, 'INTERMEDIATE': 2, 'BEGINNER': 1 };

  // Group skills by category
  const groupedSkills = skills.reduce((acc, s) => {
    const cat = s.skill?.category || s.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-fade-in">
      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
              {getCategoryIcon(category)}
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {category}
            </h4>
            <div className="hidden sm:block h-px flex-1 bg-slate-100 dark:bg-slate-800 ml-2" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {categorySkills.sort((a, b) => (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0)).map((us) => {
              const isEditing = editingId === us.id;
              // Skill name (flat or nested)
              const skillName = us.skillName || us.skill?.name || us.skill || 'Unnamed Skill';

              // Skill type normalization
              const rawType = us.skillType || us.type || '';
              const normalizedType = rawType.toUpperCase();
              const isTeach = normalizedType === 'TEACH' || normalizedType === 'TEACHING';

              if (isEditing) {
                return (
                  <div
                    key={us.id}
                    className="p-5 rounded-xl border-2 border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm transition-all"
                  >
                    <div className="font-bold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-indigo-500" /> Editing <span className="underline decoration-indigo-300">{skillName}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                      {/* Skill Type */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type</Label>
                        <select
                          value={editForm.skillType}
                          onChange={(e) => setEditForm({ ...editForm, skillType: e.target.value })}
                          className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-shadow"
                        >
                          <option value="TEACH">Teaching (I can teach this)</option>
                          <option value="LEARN">Learning (I want to learn)</option>
                        </select>
                      </div>

                      {/* Level */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Proficiency Level</Label>
                        <select
                          value={editForm.level}
                          onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                          className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-shadow"
                        >
                          <option value="BEGINNER">Beginner (1 Star)</option>
                          <option value="INTERMEDIATE">Intermediate (2 Stars)</option>
                          <option value="EXPERT">Expert (3 Stars)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg px-4"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(us.id)}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-lg px-4 min-w-[100px]"
                      >
                        {saving ? <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={us.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Card Decoration */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isTeach ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                  {/* LEFT */}
                  <div className="flex items-center gap-4 mb-3 sm:mb-0 pl-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isTeach
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                        : 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                      }`}>
                      {isTeach ? <GraduationCap className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                        {skillName}
                      </span>

                      <div className="flex items-center gap-3 text-xs mt-1.5 flex-wrap">
                        {/* TEACH / LEARN PILL */}
                        <span className={`font-bold tracking-wider text-[10px] uppercase px-2 py-0.5 rounded-full border ${isTeach
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}>
                          {isTeach ? 'Teaches' : 'Learns'}
                        </span>

                        <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />

                        {/* LEVEL */}
                        {us.level && (
                          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
                            {getLevelStars(us.level)}
                            <span className="text-slate-600 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wide">
                              {us.level.toLowerCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT - Actions */}
                  <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end pl-14 sm:pl-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      onClick={() => startEdit(us)}
                      title="Edit Skill"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(us.id)}
                      title="Remove Skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
