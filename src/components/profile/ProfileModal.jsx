import { useState } from 'react'
import Mascot from '../shared/Mascot'

const EMPTY_FORM = {
  name: '',
  birthDate: '',
  birthTime: '',
  gender: '',
  calendarType: '',
}

function toForm(profile) {
  if (!profile) return EMPTY_FORM
  return {
    name: profile.name ?? '',
    birthDate: profile.birth_date ?? '',
    birthTime: profile.birth_time ? String(profile.birth_time).slice(0, 5) : '',
    gender: profile.gender ?? '',
    calendarType: profile.calendar_type ?? '',
  }
}

export default function ProfileModal({
  title,
  copy,
  initialProfile,
  submitLabel,
  onSubmit,
  onClose,
  busy,
  error,
}) {
  const [form, setForm] = useState(() => toForm(initialProfile))

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (
      !form.name.trim() ||
      !form.birthDate ||
      !form.birthTime ||
      !form.gender ||
      !form.calendarType
    ) {
      return
    }
    await onSubmit({
      name: form.name.trim(),
      birth_date: form.birthDate,
      birth_time: form.birthTime,
      gender: form.gender,
      calendar_type: form.calendarType,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div className="modal-header">
          <Mascot size="sm" />
          <div>
            <h2 id="profile-modal-title" className="modal-title">
              {title}
            </h2>
            {copy && <p className="modal-copy">{copy}</p>}
          </div>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label htmlFor="profile-name">
            이름
            <input
              id="profile-name"
              type="text"
              value={form.name}
              onChange={updateField('name')}
              placeholder="이름을 알려달라냥"
              required
              disabled={busy}
            />
          </label>
          <label htmlFor="profile-birthDate">
            생년월일
            <input
              id="profile-birthDate"
              type="date"
              value={form.birthDate}
              onChange={updateField('birthDate')}
              required
              disabled={busy}
            />
          </label>
          <label htmlFor="profile-birthTime">
            태어난 시간
            <input
              id="profile-birthTime"
              type="time"
              value={form.birthTime}
              onChange={updateField('birthTime')}
              required
              disabled={busy}
            />
          </label>
          <label htmlFor="profile-gender">
            성별
            <select
              id="profile-gender"
              value={form.gender}
              onChange={updateField('gender')}
              required
              disabled={busy}
            >
              <option value="">선택하세요</option>
              <option value="남자">남자</option>
              <option value="여자">여자</option>
            </select>
          </label>
          <label htmlFor="profile-calendarType">
            양력/음력
            <select
              id="profile-calendarType"
              value={form.calendarType}
              onChange={updateField('calendarType')}
              required
              disabled={busy}
            >
              <option value="">선택하세요</option>
              <option value="양력">양력</option>
              <option value="음력">음력</option>
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            {onClose && (
              <button
                type="button"
                className="secondary-btn"
                onClick={onClose}
                disabled={busy}
              >
                닫기
              </button>
            )}
            <button type="submit" className="analyze-btn" disabled={busy}>
              {busy ? '저장 중이라냥...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
