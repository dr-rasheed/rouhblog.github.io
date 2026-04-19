import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import TipTapEditor from '../components/TipTapEditor';

interface EditProps {
  user: User | null;
  isAllowed: boolean;
}

export default function EditPost({ user, isAllowed }: EditProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [verse, setVerse] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('تدبر آية');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAllowed) return;
    const fetchPost = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.authorId !== user.uid) {
            alert("ليس لديك صلاحية لتعديل هذه التدوينة");
            navigate('/');
            return;
          }
          setVerse(data.verse || '');
          setContent(data.content || '');
          setCategory(data.category || 'تدبر آية');
          setTagsInput(data.tags ? data.tags.join(', ') : '');
        } else {
          alert("التدوينة غير موجودة");
          navigate('/');
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchPost();
  }, [id, user, isAllowed, navigate]);

  if (!user || !isAllowed) return <div className="text-center py-20 text-[20px]">عذراً، غير مسموح لك بالكتابة هنا.</div>;
  if (loading) return <div className="text-center py-20 text-[20px]">جاري التحميل...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !verse || !content || !category) return;
    
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      
      await updateDoc(doc(db, 'posts', id), {
        verse,
        content,
        category,
        tags,
        updatedAt: serverTimestamp(),
      });
      navigate('/profile');
    } catch (error) {
      console.error("Error updating post:", error);
      alert("حدث خطأ أثناء التحديث.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[var(--color-border-app)] rounded-[8px] flex-1 flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.02)] min-h-[500px] max-w-[900px] mx-auto w-full">
      <div className="p-4 border-b border-[var(--color-border-app)] bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-bold text-[var(--color-primary-app)]">تعديل التدوينة</h2>
      </div>
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

      <div className="flex-1 p-[20px] overflow-hidden flex flex-col h-full min-h-[400px]">
        <TipTapEditor
          value={content}
          onChange={setContent}
          placeholder="ابدأ بكتابة تدبرك وتأملاتك العميقة هنا..."
        />
      </div>

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
          {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>
    </div>
  );
}
