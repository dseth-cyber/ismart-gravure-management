'use client';

interface Props {
  content: string;
  variant?: 'markdown' | 'html' | 'plain';
  height?: number;
}

export function TextChart({ content, variant = 'plain', height: _height }: Props) {
  if (!content) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">Empty text panel</div>;
  }

  return (
    <div className="h-full overflow-auto px-1 py-1 text-sm leading-relaxed opacity-80">
      {variant === 'plain' ? content : (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </div>
  );
}
