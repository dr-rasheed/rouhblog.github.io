import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface WriteProps {
  user: User | null;
  isAllowed: boolean;
}

export default function Write({ user, isAllowed }: WriteProps) {
  const navigate = useNavigate();
  const [verse, setVerse] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('تدبر آية');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user || !isAllowed) {
    return <div className="text-center py-20 text-[20px]">عذراً، غير مسموح لك بالكتابة هنا.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verse || !content || !category) return;
    
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || 'كاتب مجهول',
        authorAvatar: user.photoURL || '',
        verse,
        content,
        category,
        tags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate('/');
    } catch (error) {
      console.error("Error creating post:", error);
      alert("حدث خطأ أثناء النشر.");
    } finally {
      setSaving(false);
    }
  };

  const modules = {
    toolbar: [
      ['bold', 'italic'],
      ['link'],
      ['blockquote'],
      [{'list': 'bullet'}, {'list': 'ordered'}]
    ],
  };

  const formats = [
    'bold', 'italic', 'link', 'blockquote', 'list', 'bullet'
  ];

  return (
    <div className="bg-white border border-[var(--color-border-app)] rounded-[8px] flex-1 flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.02)] min-h-[500px]">
      <div className="p-[20px] border-b border-[var(--color-border-app)]">
        <input 
          type="text" 
          value={verse}
          onChange={(e) => setVerse(e.target.value)}
          className="w-full border-none text-[20px] font-inherit outline-none text-[var(--color-primary-app)] font-medium"
          placeholder="اكتب الآية أو المفردة القرآنية هنا..."
          required
        />
      </div>

      <ReactQuill 
        theme="snow" 
        value={content} 
        onChange={setContent} 
        modules={modules}
        formats={formats}
        placeholder="ابدأ بكتابة تدبرك وتأملاتك العميقة..."
      />

      <div className="p-[15px_25px] border-t border-[var(--color-border-app)] flex justify-between items-center bg-white rounded-b-[8px]">
        <div className="flex gap-4 items-center">
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-[8px] border border-[var(--color-border-app)] rounded-[4px] text-[14px] bg-white outline-none"
          >
            <option value="">اختر التصنيف...</option>
            <option value="تدبر آية">تدبر آية</option>
            <option value="لطائف لغوية">لطائف لغوية</option>
            <option value="أسباب النزول">أسباب النزول</option>
            <option value="مقاصد السور">مقاصد السور</option>
          </select>
          
          <input 
            type="text" 
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="p-[8px] border border-[var(--color-border-app)] rounded-[4px] text-[14px] bg-white outline-none w-[200px]"
            placeholder="#وسم (مفصول بفاصلة)"
          />
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={saving || !verse || !content || !category}
          className="bg-[var(--color-primary-app)] text-white border-none py-[10px] px-[30px] rounded-[4px] font-bold cursor-pointer text-[16px] disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {saving ? 'جاري النشر...' : 'نشر التدوينة'}
        </button>
      </div>
    </div>
  );
}
