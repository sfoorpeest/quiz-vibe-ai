import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookCopy, LayoutDashboard, RefreshCcw, Settings2, TriangleAlert } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Footer from '../components/Footer';
import ProfileActivity from '../components/profile/ProfileActivity';
import ProfileBio from '../components/profile/ProfileBio';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileInfo from '../components/profile/ProfileInfo';
import ProfileSettings from '../components/profile/ProfileSettings';
import ProfileTabs from '../components/profile/ProfileTabs';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';

const tabs = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'courses', label: 'Khóa học', icon: BookCopy },
  { id: 'saved', label: 'Đã lưu', icon: Bookmark },
  { id: 'settings', label: 'Cài đặt', icon: Settings2 },
];

const emptyProfileForm = {
  name: '',
  username: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: '',
  address: '',
};

const initialSettings = {
  notificationEmail: true,
  notificationLearning: true,
  isProfilePrivate: false,
};

const noticeStyles = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
};

const validateProfileForm = (formData) => {
  const nextErrors = {};

  if (!formData.name.trim()) {
    nextErrors.name = 'Vui lòng nhập họ và tên.';
  }

  if (!formData.username.trim()) {
    nextErrors.username = 'Vui lòng nhập tên đăng nhập.';
  }

  if (!formData.email.trim()) {
    nextErrors.email = 'Vui lòng nhập email.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    nextErrors.email = 'Email không đúng định dạng.';
  }

  if (formData.phone.trim() && !/^[0-9+\s()-]{8,20}$/.test(formData.phone.trim())) {
    nextErrors.phone = 'Số điện thoại không hợp lệ.';
  }

  return nextErrors;
};

const buildProfileForm = (profile) => ({
  name: profile?.name || '',
  username: profile?.username || '',
  email: profile?.email || '',
  phone: profile?.phone || '',
  birthDate: profile?.birthDate || '',
  gender: profile?.gender || '',
  address: profile?.address || '',
});

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUser } = useAuth();

  const requestedTab = searchParams.get('tab');
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'overview';
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [bioDraft, setBioDraft] = useState('');
  const [settingsDraft, setSettingsDraft] = useState(initialSettings);
  const [formErrors, setFormErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [pageError, setPageError] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [saveState, setSaveState] = useState({
    profile: false,
    bio: false,
    settings: false,
    avatar: false,
  });



  const showNotice = useCallback((message, type = 'success') => {
    setNotice({ message, type });
    window.clearTimeout(showNotice.timeoutId);
    showNotice.timeoutId = window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const hydrateProfileState = useCallback((nextProfile) => {
    setProfile(nextProfile);
    setProfileForm(buildProfileForm(nextProfile));
    setBioDraft(nextProfile?.bio || '');
    setSettingsDraft({
      notificationEmail: Boolean(nextProfile?.notificationEmail),
      notificationLearning: Boolean(nextProfile?.notificationLearning),
      isProfilePrivate: Boolean(nextProfile?.isProfilePrivate),
    });
    setFormErrors({});
  }, []);

  const loadProfileData = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsPageLoading(true);
    }

    setIsActivityLoading(true);
    setPageError('');

    try {
      const [profileResponse, activityResponse, summaryResponse] = await Promise.all([
        profileService.getProfile(),
        profileService.getActivity(),
        profileService.getDashboardSummary(),
      ]);

      hydrateProfileState(profileResponse);
      setActivity(activityResponse);
      setDashboardSummary(summaryResponse);
      updateUser(profileResponse);
    } catch (error) {
      console.error('Không thể tải trang hồ sơ:', error);
      setPageError(error.response?.data?.message || 'Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsPageLoading(false);
      setIsActivityLoading(false);
      setIsRefreshing(false);
    }
  }, [hydrateProfileState, updateUser]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleTabChange = (tabId) => {
    setSearchParams(tabId === 'overview' ? {} : { tab: tabId });
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((currentState) => ({
      ...currentState,
      [field]: value,
    }));
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: '',
    }));
  };

  const handleSaveProfile = async () => {
    const errors = validateProfileForm(profileForm);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setSaveState((currentState) => ({ ...currentState, profile: true }));

    try {
      const updatedProfile = await profileService.updateProfile(profileForm);
      hydrateProfileState(updatedProfile);
      updateUser(updatedProfile);
      setIsEditingProfile(false);
      showNotice('Thông tin cá nhân đã được cập nhật.');
    } catch (error) {
      console.error('Cập nhật hồ sơ thất bại:', error);
      showNotice(error.response?.data?.message || 'Không thể lưu thông tin hồ sơ.', 'error');
    } finally {
      setSaveState((currentState) => ({ ...currentState, profile: false }));
    }
  };

  const handleSaveBio = async () => {
    setSaveState((currentState) => ({ ...currentState, bio: true }));

    try {
      const updatedProfile = await profileService.updateProfile({ bio: bioDraft });
      hydrateProfileState(updatedProfile);
      updateUser(updatedProfile);
      setIsEditingBio(false);
      showNotice('Phần giới thiệu đã được cập nhật.');
    } catch (error) {
      console.error('Cập nhật giới thiệu thất bại:', error);
      showNotice(error.response?.data?.message || 'Không thể lưu phần giới thiệu.', 'error');
    } finally {
      setSaveState((currentState) => ({ ...currentState, bio: false }));
    }
  };

  const handleSaveSettings = async () => {
    setSaveState((currentState) => ({ ...currentState, settings: true }));

    try {
      const updatedProfile = await profileService.updateProfile(settingsDraft);
      hydrateProfileState(updatedProfile);
      updateUser(updatedProfile);
      setIsEditingSettings(false);
      showNotice('Cài đặt hồ sơ đã được lưu.');
    } catch (error) {
      console.error('Cập nhật cài đặt thất bại:', error);
      showNotice(error.response?.data?.message || 'Không thể lưu cài đặt.', 'error');
    } finally {
      setSaveState((currentState) => ({ ...currentState, settings: false }));
    }
  };

  const handleAvatarSelect = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setSaveState((currentState) => ({ ...currentState, avatar: true }));

    try {
      const updatedProfile = await profileService.uploadAvatar(selectedFile);
      hydrateProfileState(updatedProfile);
      updateUser(updatedProfile);
      showNotice('Ảnh đại diện đã được cập nhật.');
    } catch (error) {
      console.error('Tải ảnh đại diện thất bại:', error);
      showNotice(error.response?.data?.message || 'Không thể tải lên ảnh đại diện.', 'error');
    } finally {
      event.target.value = '';
      setSaveState((currentState) => ({ ...currentState, avatar: false }));
    }
  };

  const summaryCards = profile?.role_id === 2 || profile?.role_id === 3
    ? [
        { label: 'Học liệu', value: dashboardSummary?.stats?.totalMaterials || 0, helper: 'Nội dung đã tạo' },
        { label: 'Bài quiz', value: dashboardSummary?.stats?.totalQuizzes || 0, helper: 'Bài đánh giá đã tạo' },
        { label: 'Tương tác', value: dashboardSummary?.stats?.totalInteractions || 0, helper: 'Lượt tương tác gần đây' },
      ]
    : [
        { label: 'Đã học', value: dashboardSummary?.stats?.totalLearned || 0, helper: 'Chủ đề đã trải nghiệm' },
        { label: 'Điểm TB', value: dashboardSummary?.stats?.avgScore || 0, helper: 'Điểm trung bình bài quiz' },
        { label: 'Hoạt động', value: activity.length, helper: 'Bản ghi gần đây' },
      ];

  const courseActivities = activity.filter((item) => item.itemType === 'material' || item.itemType === 'quiz');

  const renderOverview = () => (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="space-y-6">
        <ProfileInfo
          profile={profile}
          formData={profileForm}
          errors={formErrors}
          isEditing={isEditingProfile}
          isSaving={saveState.profile}
          onChange={handleProfileFieldChange}
          onSave={handleSaveProfile}
          onCancel={() => {
            setProfileForm(buildProfileForm(profile));
            setFormErrors({});
            setIsEditingProfile(false);
          }}
          onStartEdit={() => setIsEditingProfile(true)}
        />
        <ProfileActivity
          title="Hoạt động gần đây"
          description="Theo dõi các bài học và bài kiểm tra bạn vừa tương tác."
          items={activity}
          isLoading={isActivityLoading}
          emptyMessage="Hãy bắt đầu một khóa học hoặc bài kiểm tra để lịch sử hoạt động xuất hiện ở đây."
        />
      </div>

      <div className="space-y-6">
        <ProfileBio
          bio={profile?.bio}
          draftBio={bioDraft}
          isEditing={isEditingBio}
          isSaving={saveState.bio}
          onChange={setBioDraft}
          onStartEdit={() => setIsEditingBio(true)}
          onCancel={() => {
            setBioDraft(profile?.bio || '');
            setIsEditingBio(false);
          }}
          onSave={handleSaveBio}
        />
        <ProfileSettings
          settings={settingsDraft}
          isEditing={isEditingSettings}
          isSaving={saveState.settings}
          onToggle={(field) => {
            setSettingsDraft((currentState) => ({
              ...currentState,
              [field]: !currentState[field],
            }));
          }}
          onSave={handleSaveSettings}
          onCancel={() => {
            setSettingsDraft({
              notificationEmail: Boolean(profile?.notificationEmail),
              notificationLearning: Boolean(profile?.notificationLearning),
              isProfilePrivate: Boolean(profile?.isProfilePrivate),
            });
            setIsEditingSettings(false);
          }}
          onStartEdit={() => setIsEditingSettings(true)}
          onChangePassword={() => navigate('/change-password')}
        />
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      {dashboardSummary?.lastMaterial && (
        <section className="rounded-4xl border border-blue-500/20 bg-slate-900/75 p-6 shadow-xl shadow-blue-950/10 backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Khóa học đang tiếp tục</p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">{dashboardSummary.lastMaterial.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{dashboardSummary.lastMaterial.description || 'Tiếp tục từ điểm dừng gần nhất để duy trì tiến độ học tập.'}</p>
            </div>
            <div className="rounded-3xl border border-slate-700/60 bg-slate-950/50 px-5 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tiến độ</p>
              <p className="mt-2 text-3xl font-extrabold text-white">{dashboardSummary.lastMaterial.progress || 0}%</p>
            </div>
          </div>
        </section>
      )}

      <ProfileActivity
        title="Khóa học và bài kiểm tra"
        description="Danh sách các nội dung bạn đã học hoặc bắt đầu gần đây."
        items={courseActivities}
        isLoading={isActivityLoading}
        emptyMessage="Hiện chưa có khóa học hoặc bài quiz nào được ghi nhận trong hồ sơ của bạn."
      />
    </div>
  );

  const renderSaved = () => (
    <section className="rounded-4xl border border-dashed border-slate-700 bg-slate-900/75 px-6 py-16 text-center shadow-xl shadow-blue-950/10 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-800 text-slate-400">
        <Bookmark className="h-7 w-7" />
      </div>
      <h2 className="mt-6 text-2xl font-extrabold text-white">Chưa có mục đã lưu</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
        Phần này đã được chuẩn bị sẵn trong hồ sơ để mở rộng sau. Khi hệ thống hỗ trợ lưu khóa học, bài viết hoặc tài nguyên, chúng sẽ xuất hiện ở đây.
      </p>
    </section>
  );

  const renderSettings = () => (
    <ProfileSettings
      settings={settingsDraft}
      isEditing={true}
      isSaving={saveState.settings}
      onToggle={(field) => {
        setSettingsDraft((currentState) => ({
          ...currentState,
          [field]: !currentState[field],
        }));
      }}
      onSave={handleSaveSettings}
      onCancel={() => {
        setSettingsDraft({
          notificationEmail: Boolean(profile?.notificationEmail),
          notificationLearning: Boolean(profile?.notificationLearning),
          isProfilePrivate: Boolean(profile?.isProfilePrivate),
        });
      }}
      onStartEdit={() => setIsEditingSettings(true)}
      onChangePassword={() => navigate('/change-password')}
    />
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-50 flex flex-col">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen">
        <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 text-slate-200 transition hover:border-blue-500/40 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">EduApp</p>
                <h1 className="text-lg font-extrabold text-white sm:text-xl">Hồ sơ cá nhân</h1>
              </div>
            </div>
            <Link to="/" className="text-sm font-bold text-slate-300 transition hover:text-white">
              Quay về trang chủ
            </Link>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {notice && (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${noticeStyles[notice.type]}`}>
              {notice.message}
            </div>
          )}

          {pageError && !isPageLoading && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Không thể tải hồ sơ</p>
                  <p className="mt-1">{pageError}</p>
                </div>
              </div>
            </div>
          )}

          {isPageLoading ? (
            <div className="space-y-6">
              <div className="h-72 animate-pulse rounded-4xl border border-slate-800 bg-slate-900/70" />
              <div className="h-20 animate-pulse rounded-4xl border border-slate-800 bg-slate-900/70" />
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="h-96 animate-pulse rounded-4xl border border-slate-800 bg-slate-900/70" />
                <div className="h-96 animate-pulse rounded-4xl border border-slate-800 bg-slate-900/70" />
              </div>
            </div>
          ) : (
            <>
              <ProfileHeader
                profile={profile}
                summary={summaryCards}
                isEditing={isEditingProfile || isEditingBio || isEditingSettings}
                isUploadingAvatar={saveState.avatar}
                onAvatarSelect={handleAvatarSelect}
                onToggleEdit={() => {
                  setIsEditingProfile(true);
                  setIsEditingBio(true);
                  setIsEditingSettings(true);
                }}
                onRefresh={() => loadProfileData({ silent: true })}
              />

              <div className="flex items-center justify-between gap-3">
                <ProfileTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
                <button
                  type="button"
                  onClick={() => loadProfileData({ silent: true })}
                  className="hidden items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-blue-500/40 hover:text-white md:inline-flex"
                >
                  <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Làm mới dữ liệu
                </button>
              </div>

              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'courses' && renderCourses()}
              {activeTab === 'saved' && renderSaved()}
              {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
