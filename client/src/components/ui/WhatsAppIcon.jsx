/** Simple WhatsApp-style glyph (speech bubble + handset), drawn with strokes like the lucide icons. */
export default function WhatsAppIcon({ size = 20, strokeWidth = 1.8, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 21l1.65-4.85A9 9 0 1 1 8 19.4L3 21z" />
      <path d="M9.2 8.6c.2 2.8 3.4 6 6.2 6.2l1-1.1a.6.6 0 0 0 0-.8l-1.4-1a.6.6 0 0 0-.7 0l-.6.5c-.9-.4-1.8-1.3-2.2-2.2l.5-.6a.6.6 0 0 0 0-.7l-1-1.4a.6.6 0 0 0-.8 0z" />
    </svg>
  );
}
