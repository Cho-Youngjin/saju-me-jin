import GuestHome from './components/guest/GuestHome'
import AuthScreen from './components/layout/AuthScreen'
import Sidebar from './components/layout/Sidebar'
import ProfileModal from './components/profile/ProfileModal'
import MemberHome from './components/reading/MemberHome'
import ReadingResult from './components/reading/ReadingResult'
import { useSajuApp } from './hooks/useSajuApp'

export default function App() {
  const {
    authReady,
    authBusy,
    user,
    profile,
    guestProfile,
    result,
    loading,
    error,
    profileError,
    readings,
    selectedId,
    busy,
    savingProfile,
    needsOnboarding,
    showProfileModal,
    googleName,
    handleGoogleLogin,
    handleLogout,
    handleSaveProfile,
    handleGuestAnalyze,
    handleAnalyze,
    handleDelete,
    handleSelectReading,
    openProfileEditor,
    closeProfileEditor,
  } = useSajuApp()

  if (!authReady) {
    return <AuthScreen />
  }

  return (
    <div className={user ? 'layout' : 'layout layout-guest'}>
      {user && (
        <Sidebar
          email={user.email}
          hasProfile={Boolean(profile)}
          readings={readings}
          selectedId={selectedId}
          busy={busy}
          onEditProfile={openProfileEditor}
          onLogout={handleLogout}
          onSelectReading={handleSelectReading}
        />
      )}

      <div className="app">
        {user ? (
          <MemberHome
            profile={profile}
            readings={readings}
            selectedId={selectedId}
            loading={loading}
            busy={busy}
            onAnalyze={handleAnalyze}
            onDelete={handleDelete}
          />
        ) : (
          <GuestHome
            guestProfile={guestProfile}
            loading={loading}
            result={result}
            busy={busy}
            authBusy={authBusy}
            onLogin={handleGoogleLogin}
            onAnalyze={handleGuestAnalyze}
          />
        )}

        {error && (
          <p className="error" style={{ color: 'red' }}>
            {error}
          </p>
        )}

        <ReadingResult
          user={user}
          result={result}
          loading={loading}
          authBusy={authBusy}
          onLogin={handleGoogleLogin}
        />
      </div>

      {showProfileModal && (
        <ProfileModal
          key={profile?.id ?? 'onboarding'}
          title={needsOnboarding ? '내 정보 알려달라냥' : '프로필 수정'}
          copy={
            needsOnboarding
              ? '사주를 보려면 필수 정보를 적어달라냥.'
              : '바꾼 내용은 다음 풀이부터 반영된다냥.'
          }
          initialProfile={
            profile ?? (googleName ? { name: googleName } : null)
          }
          submitLabel={needsOnboarding ? '시작할게냥' : '저장할게냥'}
          onSubmit={handleSaveProfile}
          onClose={needsOnboarding ? undefined : closeProfileEditor}
          busy={savingProfile}
          error={profileError}
        />
      )}
    </div>
  )
}
