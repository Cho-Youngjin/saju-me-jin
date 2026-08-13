export default function Mascot({ size = 'md' }) {
  return (
    <img
      src="/assets/mascot.png"
      alt="사주 미 고양이"
      className={`mascot mascot-${size}`}
    />
  )
}
