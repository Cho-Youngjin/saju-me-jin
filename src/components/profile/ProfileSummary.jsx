import { formatBirthTime } from '../../lib/format'

export default function ProfileSummary({ profile }) {
  return (
    <section className="profile-summary" aria-label="내 사주 정보">
      <h1 className="preview">{profile.name}님의 사주</h1>
      <dl className="profile-facts">
        <div>
          <dt>생년월일</dt>
          <dd>{profile.birth_date}</dd>
        </div>
        <div>
          <dt>태어난 시간</dt>
          <dd>{formatBirthTime(profile.birth_time)}</dd>
        </div>
        <div>
          <dt>성별</dt>
          <dd>{profile.gender}</dd>
        </div>
        <div>
          <dt>양력/음력</dt>
          <dd>{profile.calendar_type}</dd>
        </div>
      </dl>
    </section>
  )
}
