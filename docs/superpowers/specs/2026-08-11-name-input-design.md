# 사주 입력 플랫폼 — 1단계: 이름 input

날짜: 2026-08-11  
상태: 설계 승인됨 (구현 전 스펙 리뷰 대기)

## 목표

React로 사주 입력 플랫폼을 만들기 위한 **첫 단계**.  
`useState` + controlled input (`value` / `onChange`) 패턴만 익힌다.

## 범위

### 포함

- `App.jsx`에 `name` 상태 (`useState('')`)
- 이름 `label` + `input` 연결 (`value={name}`, `onChange` → `setName`)
- input 아래 현재 `name` 미리보기 (비어 있으면 안내 문구)
- 초보자용 짧은 주석 (`useState` / `value` / `onChange`)

### 제외

- 생년월일, 태어난 시간, 성별, 양력/음력
- 제출 버튼, 사주 계산/결과 UI
- 별도 컴포넌트 분리, 폼 라이브러리
- 복잡한 스타일/디자인 시스템

## 접근

`App.jsx`에 직접 구현 (단일 파일, 학습용으로 가장 단순).

## 데이터 흐름

1. 사용자가 input에 타이핑한다.
2. `onChange`가 `setName(e.target.value)`를 호출한다.
3. `name`이 바뀌면 컴포넌트가 다시 렌더된다.
4. `value={name}`과 미리보기 텍스트가 같은 상태를 보여준다.

## 성공 기준

- input에 글자를 치면 아래 미리보기가 같이 바뀐다.
- 다른 입력 필드/버튼/결과 UI가 없다.
- 코드만 읽고도 controlled input 패턴을 따라갈 수 있다.
