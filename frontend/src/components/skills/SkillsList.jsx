import React, { useEffect, useState } from 'react';
import { profileApi } from '../../api/profile';
import { Button } from '../ui/Button';

export const SkillsList = ({ refreshTrigger }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, [refreshTrigger]);

  const loadSkills = async () => {
    try {
      const { data } = await profileApi.getUserSkills();
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load skills', err);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
  if (!confirm('Remove this skill?')) return;

  try {
    await profileApi.deleteUserSkill(id);

    // ✅ Remove locally instead of refetching immediately
    setSkills((prev) => prev.filter((s) => s.id !== id));
  } catch (err) {
    console.error(err);

    // Only show error if it's NOT "already deleted"
    if (err.response?.status !== 404) {
      alert('Failed to delete skill');
    }
  }
};


  if (loading) {
    return <div className="text-sm text-gray-500">Loading skills…</div>;
  }

  if (!skills.length) {
    return <div className="text-sm text-gray-500 py-4">No skills added yet.</div>;
  }

  return (
    <div className="space-y-3">
      {skills.map((us) => {
        /* ---------- NORMALIZATION ---------- */

        // Skill name (flat or nested)
        const skillName =
          us.skillName ||
          us.skill?.name ||
          us.skill ||
          'Unnamed Skill';

        // Skill type normalization
        const rawType = us.skillType || us.type || '';
        const normalizedType = rawType.toUpperCase();

        const isTeach =
          normalizedType === 'TEACH' ||
          normalizedType === 'TEACHING';

        /* ----------------------------------- */

        return (
          <div
            key={us.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
          >
            {/* LEFT */}
            <div className="flex flex-col gap-1">
              <span className="font-medium text-gray-900">
                {skillName}
              </span>

              <div className="flex items-center gap-2 text-xs">
                {/* TEACH / LEARN INDICATOR */}
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold tracking-wide
                    ${
                      isTeach
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                >
                  {isTeach ? 'TEACHING' : 'LEARNING'}
                </span>

                {/* LEVEL */}
                {us.level && (
                  <span className="text-gray-500 uppercase tracking-wide">
                    {us.level}
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDelete(us.id)}
            >
              Remove
            </Button>
          </div>
        );
      })}
    </div>
  );
};
