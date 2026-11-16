interface Props {
  className?: string
  suelo?: boolean
}

// Pacha, el asistente: un cardón de la Quebrada con su flor.
export default function Pacha({ className, suelo = true }: Props) {
  return (
    <svg viewBox="0 0 120 140" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {suelo && <ellipse cx="60" cy="127" rx="36" ry="7" fill="#e3b96a" />}
      <g stroke="#3f8f52" strokeWidth="15">
        <path d="M46 88H25V62" />
        <path d="M74 76h21V50" />
      </g>
      <path d="M60 40v82" stroke="#4d9a5b" strokeWidth="36" />
      <g stroke="#2f7340" strokeWidth="2" opacity="0.45">
        <path d="M50 34v88M70 34v88M25 64v14M95 52v14" />
      </g>
      <g stroke="#f4f1de" strokeWidth="1.6">
        <path d="M43 44l-5-3M77 44l5-3M42 104l-5 2M78 104l5 2M60 100v-5M18 60l-4-3M102 48l4-3" />
      </g>
      <g fill="#f472b6">
        <circle cx="60" cy="14" r="5.5" />
        <circle cx="52" cy="20" r="5.5" />
        <circle cx="68" cy="20" r="5.5" />
        <circle cx="55" cy="28" r="5.5" />
        <circle cx="65" cy="28" r="5.5" />
        <circle cx="95" cy="42" r="4.5" />
      </g>
      <circle cx="60" cy="22" r="4.5" fill="#fbbf24" />
      <circle cx="95" cy="42" r="2" fill="#fbbf24" />
      <ellipse cx="47" cy="72" rx="4.5" ry="3" fill="#f9a8d4" opacity="0.75" />
      <ellipse cx="73" cy="72" rx="4.5" ry="3" fill="#f9a8d4" opacity="0.75" />
      <circle cx="52" cy="63" r="3.6" fill="#1c1917" />
      <circle cx="68" cy="63" r="3.6" fill="#1c1917" />
      <circle cx="53.2" cy="61.8" r="1.2" fill="#fff" />
      <circle cx="69.2" cy="61.8" r="1.2" fill="#fff" />
      <path d="M53 72q7 7 14 0" stroke="#1c1917" strokeWidth="2.4" />
    </svg>
  )
}
