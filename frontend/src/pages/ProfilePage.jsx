import { useCallback, useEffect, useState } from 'react';
import { useDialog } from '../context/DialogContext';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { profileApi } from '../api/profile';
import { useAuth } from '../auth/AuthContext';
import { SkillsList } from '../components/skills/SkillsList';
import { AddSkillForm } from '../components/skills/AddSkillForm';
import AdminActivityPanel from '../components/admin/AdminActivityPanel';
import useLiveRefresh from '../hooks/useLiveRefresh';
import PresenceBadge from '../components/ui/PresenceBadge';

const ProfilePage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const dialog = useDialog();

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

  const loadProfile = useCallback(async ({ silent = false } = {}) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    try {
      const { data } = await profileApi.getProfile();

      setProfile({
        name: user.name,
        profileImageUrl: user.profileImageUrl,
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
  }, [user?.id, user?.name, user?.presenceStatus, user?.profileImageUrl]);

  useEffect(() => {
    if (!user?.id) return;
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Wrap loadProfile for useLiveRefresh – always silent on background refreshes
  const silentRefreshProfile = useCallback(() => loadProfile({ silent: true }), [loadProfile]);

  useLiveRefresh({
    refresh: silentRefreshProfile,
    enabled: !!user?.id,
    events: ['connection'],
    runOnMount: false,
    minIntervalMs: 5000,
    pollIntervalMs: 30000,
  });

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
      await dialog.alert('Error', 'Failed to update profile');
    }
  };

  const onSkillAdded = () => {
    setIsAddingSkill(false);
    setSkillRefresh((v) => v + 1);
  };

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="text-center py-12 text-muted-foreground">Loading profile…</div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="text-center py-12 text-destructive">
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
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-secondary text-primary flex items-center justify-center text-3xl font-bold overflow-hidden">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              {!isEditing ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-xl font-bold">{profile.name}</h2>
                    {profile.role === 'ADMIN' && isAdmin && (
                      <Badge variant="destructive">
                        ADMIN
                      </Badge>
                    )}
                  </div>

                  {profile.headline && (
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                      {profile.headline}
                    </p>
                  )}

                  {user?.presenceStatus && (
                    <div className="mt-4 flex justify-center">
                      <PresenceBadge status={user.presenceStatus} />
                    </div>
                  )}

                  {isAdmin && <AdminActivityPanel userId={user?.id} />}

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
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                      id="headline"
                      placeholder="Short professional summary"
                      value={formData.headline}
                      onChange={(e) =>
                        setFormData({ ...formData, headline: e.target.value })
                      }
                    />
                  </div>
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
            </CardContent>
          </Card>

          {/* ABOUT CARD */}
          <Card>
            <CardHeader>
              <CardTitle>About You</CardTitle>
              <CardDescription>Who you are and what motivates you</CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.about || 'No description added yet.'}
                </p>
              ) : (
                <Textarea
                  rows={4}
                  value={formData.about}
                  onChange={(e) =>
                    setFormData({ ...formData, about: e.target.value })
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — DETAILS & SKILLS (8 cols) */}
        <div className="md:col-span-8 space-y-6">

          {/* LEARNING & TEACHING GRID */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Learning Goals</CardTitle>
                <CardDescription>What you want to improve</CardDescription>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile.learningGoals || 'Not specified'}
                  </p>
                ) : (
                  <Textarea
                    rows={4}
                    value={formData.learningGoals}
                    onChange={(e) =>
                      setFormData({ ...formData, learningGoals: e.target.value })
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>Teaching Style</CardTitle>
                <CardDescription>How you help others</CardDescription>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile.teachingStyle || 'Not specified'}
                  </p>
                ) : (
                  <Textarea
                    rows={4}
                    value={formData.teachingStyle}
                    onChange={(e) =>
                      setFormData({ ...formData, teachingStyle: e.target.value })
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* SKILLS */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Skills</CardTitle>
                <CardDescription>Manage your expertise and interests</CardDescription>
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
            </CardHeader>
            <CardContent>
              {isAddingSkill && (
                <div className="mb-6">
                  <AddSkillForm
                    onSuccess={onSkillAdded}
                    onCancel={() => setIsAddingSkill(false)}
                  />
                </div>
              )}

              <SkillsList refreshTrigger={skillRefresh} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
