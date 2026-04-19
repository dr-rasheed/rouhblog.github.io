import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote } from 'lucide-react';

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TipTapEditor({ value, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose mx-auto focus:outline-none min-h-[300px] w-full max-w-none',
        dir: 'rtl'
      },
    },
  });

  if (!editor) {
    return null;
  }

  const btnClass = (isActive: boolean) => 
    `p-[6px] text-[14px] flex items-center justify-center border border-[var(--color-border-app)] rounded transition-colors cursor-pointer ${isActive ? 'bg-[var(--color-accent-app)] text-white border-[var(--color-accent-app)]' : 'bg-white text-[var(--color-primary-app)] hover:bg-[#fafafa]'}`;

  return (
    <div className="flex flex-col h-full w-full border border-[var(--color-border-app)] rounded-[4px] overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-[4px] p-[8px] bg-[#fdfdfd] border-b border-[var(--color-border-app)]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="عريض (Bold)"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="مائل (Italic)"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="أسفله خط (Underline)"
        >
          <UnderlineIcon size={16} />
        </button>

        <div className="w-[1px] h-[20px] bg-[var(--color-border-app)] mx-[4px]"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={btnClass(editor.isActive({ textAlign: 'right' }))}
          title="محاذاة لليمين"
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={btnClass(editor.isActive({ textAlign: 'center' }))}
          title="توسيط"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={btnClass(editor.isActive({ textAlign: 'left' }))}
          title="محاذاة لليسار"
        >
          <AlignLeft size={16} />
        </button>

        <div className="w-[1px] h-[20px] bg-[var(--color-border-app)] mx-[4px]"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="قائمة نقطية"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="قائمة رقمية"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="اقتباس"
        >
          <Quote size={16} />
        </button>

        <div className="w-[1px] h-[20px] bg-[var(--color-border-app)] mx-[4px]"></div>
        
        <input
          type="color"
          onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          className="w-[28px] h-[28px] p-0 border-0 cursor-pointer bg-transparent rounded"
          title="لون النص"
        />
      </div>

      {/* Editor Area */}
      <div className="p-[15px] flex-1 overflow-y-auto cursor-text" onClick={() => editor.chain().focus().run()}>
        {editor.isEmpty && (
           <div className="absolute text-gray-400 pointer-events-none mt-[2px]">{placeholder}</div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
