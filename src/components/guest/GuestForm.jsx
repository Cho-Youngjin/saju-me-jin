import { useState } from 'react'

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

export default function GuestForm({ initialProfile, submitLabel, onSubmit, busy }) {
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
    <form className="modal-form guest-form" onSubmit={handleSubmit}>
      <label htmlFor="guest-name">
        이름
        <input
          id="guest-name"
          type="text"
          value={form.name}
          onChange={updateField('name')}
          placeholder="이름을 알려달라냥"
          required
          disabled={busy}
        />
      </label>
      <label htmlFor="guest-birthDate">
        생년월일
        <input
          id="guest-birthDate"
          type="date"
          value={form.birthDate}
          onChange={updateField('birthDate')}
          required
          disabled={busy}
        />
      </label>
      <label htmlFor="guest-birthTime">
        태어난 시간
        <input
          id="guest-birthTime"
          type="time"
          value={form.birthTime}
          onChange={updateField('birthTime')}
          required
          disabled={busy}
        />
      </label>
      <label htmlFor="guest-gender">
        성별
        <select
          id="guest-gender"
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
      <label htmlFor="guest-calendarType">
        양력/음력
        <select
          id="guest-calendarType"
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
      <button type="submit" className="analyze-btn" disabled={busy}>
        {submitLabel}
      </button>
    </form>
  )
}
