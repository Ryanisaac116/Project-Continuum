import { useEffect, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { profileApi } from '../api/profile';
import { useAuth } from '../auth/AuthContext';
import { SkillsList } from '../components/skills/SkillsList';
import { AddSkillForm } from '../components/skills/AddSkillForm';

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [skillRefresh, setSkillRefresh] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    about: '',
    learningGoals: '',
    teachingStyle: ''
  });

  useEffect(() => {
    if (!user?.id) return;
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await profileApi.getProfile();

      setProfile({
        name: user.name,
        presenceStatus: user.presenceStatus,
        ...data
      });

      setFormData({
        name: user.name || '',
        headline: data.headline || '',
        about: data.about || '',
        learningGoals: data.learningGoals || '',
        teachingStyle: data.teachingStyle || ''
      });
    } catch (err) {
      console.error('Profile load failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await profileApi.updateMe({ name: formData.name });
      await profileApi.updateProfile({
        headline: formData.headline,
        about: formData.about,
        learningGoals: formData.learningGoals,
        teachingStyle: formData.teachingStyle
      });

      setIsEditing(false);
      loadProfile();
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  const onSkillAdded = () => {
    setIsAddingSkill(false);
    setSkillRefresh((v) => v + 1);
  };

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="text-center py-12 text-slate-500">Loading profile…</div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="text-center py-12 text-red-500">
          Unable to load profile
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="grid gap-6 md:grid-cols-12">

        {/* LEFT COLUMN — IDENTITY (4 cols) */}
        <div className="md:col-span-4 space-y-6">
          {/* USER CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm text-center transition-colors">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 text-blue-600 dark:text-blue-500 flex items-center justify-center text-3xl font-bold transition-colors">
              {profile.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            {!isEditing ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{profile.name}</h2>

                {profile.headline && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 font-medium transition-colors">
                    {profile.headline}
                  </p>
                )}

                {user?.presenceStatus && (
                  <div className="mt-4 flex justify-center">
                    <Badge status={user.presenceStatus} />
                  </div>
                )}

                <Button
                  variant="outline"
                  className="mt-6 w-full"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              </>
            ) : (
              <div className="space-y-4 text-left mt-6">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <Input
                  label="Headline"
                  placeholder="Short professional summary"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData({ ...formData, headline: e.target.value })
                  }
                />
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleUpdate} className="flex-1">
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ABOUT CARD */}
          <Card>
            <CardHeader
              title="About You"
              description="Who you are and what motivates you"
            />
            {!isEditing ? (
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed transition-colors">
                {profile.about || 'No description added yet.'}
              </p>
            ) : (
              <textarea
                className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                rows={4}
                value={formData.about}
                onChange={(e) =>
                  setFormData({ ...formData, about: e.target.value })
                }
              />
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN — DETAILS & SKILLS (8 cols) */}
        <div className="md:col-span-8 space-y-6">

          {/* LEARNING & TEACHING GRID */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="h-full">
              <CardHeader
                title="Learning Goals"
                description="What you want to improve"
              />
              {!isEditing ? (
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed transition-colors">
                  {profile.learningGoals || 'Not specified'}
                </p>
              ) : (
                <textarea
                  className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                  rows={4}
                  value={formData.learningGoals}
                  onChange={(e) =>
                    setFormData({ ...formData, learningGoals: e.target.value })
                  }
                />
              )}
            </Card>

            <Card className="h-full">
              <CardHeader
                title="Teaching Style"
                description="How you help others"
              />
              {!isEditing ? (
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed transition-colors">
                  {profile.teachingStyle || 'Not specified'}
                </p>
              ) : (
                <textarea
                  className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                  rows={4}
                  value={formData.teachingStyle}
                  onChange={(e) =>
                    setFormData({ ...formData, teachingStyle: e.target.value })
                  }
                />
              )}
            </Card>
          </div>

          {/* SKILLS */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">Skills</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 transition-colors">Manage your expertise and interests</p>
              </div>
              {!isAddingSkill && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsAddingSkill(true)}
                >
                  + Add Skill
                </Button>
              )}
            </div>

            {isAddingSkill && (
              <div className="mb-6">
                <AddSkillForm
                  onSuccess={onSkillAdded}
                  onCancel={() => setIsAddingSkill(false)}
                />
              </div>
            )}

            <SkillsList refreshTrigger={skillRefresh} />
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
