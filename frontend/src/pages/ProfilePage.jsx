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
    if (!user) return;
    loadProfile();
  }, [user]);

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
        <div className="text-center py-12 text-gray-500">Loading profile…</div>
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
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">

        {/* LEFT COLUMN — IDENTITY */}
        <div className="space-y-6">
          <Card>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                {profile.name?.charAt(0) || 'U'}
              </div>

              {!isEditing ? (
                <>
                  <h2 className="text-xl font-semibold">{profile.name}</h2>

                  {profile.headline && (
                    <p className="text-sm text-gray-600 mt-1">
                      {profile.headline}
                    </p>
                  )}

                  {user?.presenceStatus && (
                    <Badge status={user.presenceStatus} className="mt-2" />
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-6 w-full"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                </>
              ) : (
                <div className="space-y-4 text-left">
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
                    <Button size="sm" onClick={handleUpdate}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ABOUT CARD */}
          <Card>
            <CardHeader
              title="About You"
              description="Who you are and what motivates you"
            />
            {!isEditing ? (
              <p className="text-sm text-gray-600">
                {profile.about || 'No description added yet.'}
              </p>
            ) : (
              <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={4}
                value={formData.about}
                onChange={(e) =>
                  setFormData({ ...formData, about: e.target.value })
                }
              />
            )}
          </Card>

          {/* LEARNING */}
          <Card>
            <CardHeader
              title="Learning Goals"
              description="What you want to improve or learn"
            />
            {!isEditing ? (
              <p className="text-sm text-gray-600">
                {profile.learningGoals || 'Not specified'}
              </p>
            ) : (
              <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
                value={formData.learningGoals}
                onChange={(e) =>
                  setFormData({ ...formData, learningGoals: e.target.value })
                }
              />
            )}
          </Card>

          {/* TEACHING */}
          <Card>
            <CardHeader
              title="Teaching Style"
              description="How you prefer to help others learn"
            />
            {!isEditing ? (
              <p className="text-sm text-gray-600">
                {profile.teachingStyle || 'Not specified'}
              </p>
            ) : (
              <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
                value={formData.teachingStyle}
                onChange={(e) =>
                  setFormData({ ...formData, teachingStyle: e.target.value })
                }
              />
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN — SKILLS */}
        <div className="md:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <CardHeader
                title="Skills"
                description="What you can teach or want to learn"
              />
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
              <AddSkillForm
                onSuccess={onSkillAdded}
                onCancel={() => setIsAddingSkill(false)}
              />
            )}

            <SkillsList refreshTrigger={skillRefresh} />
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
