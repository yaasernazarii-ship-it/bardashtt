'use client';

export default function OpenChatButton({ className, children }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event('bardasht:open-chat'))}
    >
      {children}
    </button>
  );
}
