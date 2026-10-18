import { avatarColor, initials } from '../../lib/phone'

export default function Avatar({ name, seed, size = 48 }) {
  const label = name?.trim() ? name : '?'
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: avatarColor(seed || label),
        fontSize: Math.round(size * 0.38),
      }}
    >
      {initials(label)}
    </div>
  )
}
