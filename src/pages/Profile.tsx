import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { updateProfile, User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuthors } from '../contexts/AuthorsContext';

interface Post {
  id: string;
  verse: string;
  category: string;
  createdAt: any;
  authorId: string;
}

export default function Profile({ user, isAllowed }: { user: User | null, isAllowed: boolean }) {
  const navigate = useNavigate();
  const { authorsMap } = useAuthors();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentAuthor = user ? authorsMap.get(user.uid) : null;
  const initialName = currentAuthor?.displayName || user?.displayName || user?.email || '';
  
  const [editableName, setEditableName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (currentAuthor && editableName === '') {
      setEditableName(currentAuthor.displayName);
    }
  }, [currentAuthor]);

  useEffect(() => {
    if (!user || !isAllowed) {
      navigate('/');
      return;
    }
    fetchMyPosts();
  }, [user, isAllowed, navigate]);

  const fetchMyPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snapAll = await getDocs(collection(db, 'posts'));
      const batch = writeBatch(db);
      let needsCommit = false;
      const parsedPosts: Post[] = [];

      snapAll.forEach(d => {
        const data = d.data();
        let isMine = false;
        
        if (data.authorId === user.uid) {
           isMine = true;
        } else if (!data.authorId && data.authorName && (data.authorName === user.displayName || data.authorName === user.email || data.authorName === currentAuthor?.displayName)) {
           // Orphaned post matching name
           isMine = true;
           batch.update(d.ref, { authorId: user.uid });
           needsCommit = true;
        }

        if (isMine) {
          parsedPosts.push({ id: d.id, ...data } as Post);
        }
      });

      if (needsCommit) {
        await batch.commit();
      }

      parsedPosts.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPosts(parsedPosts);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleNameSave = async () => {
    const newName = editableName.trim();
    if (!user || !newName || newName === currentAuthor?.displayName) return;
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: newName });
      await updateDoc(doc(db, 'authors', user.uid), {
        displayName: newName
      });
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ الاسم.");
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه التدوينة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(posts.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  if (loading) return <div className="text-center py-20 text-[20px]">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-8 max-w-[900px] w-full mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-primary-app)] border-b pb-4">إعدادات الحساب و تدويناتي</h1>
      
      <div className="bg-white p-6 rounded-lg border flex flex-col gap-4 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--color-accent-app)]">معلومات الكاتب</h2>
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-2 flex-1 max-w-sm">
            <label className="text-sm font-bold text-gray-600">الاسم المعروض</label>
            <input 
              type="text" 
              value={editableName}
              onChange={(e) => setEditableName(e.target.value)}
              className="border border-[var(--color-border-app)] p-2 rounded outline-none focus:border-[var(--color-accent-app)]"
            />
          </div>
          <button 
            onClick={handleNameSave}
            disabled={savingName || editableName === currentAuthor?.displayName}
            className="bg-[var(--color-primary-app)] text-white px-6 py-[9px] rounded font-bold disabled:opacity-50 hover:bg-opacity-90 font-[15px]"
          >
            {savingName ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
          <button 
            onClick={() => {
               // Fallback clear
               sessionStorage.clear();
               window.location.href = window.location.pathname + '?refresh=' + new Date().getTime();
            }}
            className="bg-gray-100 text-gray-600 border border-gray-300 px-4 py-[9px] rounded font-bold hover:bg-gray-200 transition-colors font-[15px]"
            title="انقر هنا إذا لم تتحدث الأسماء في الموقع"
          >
            تحديث الصفحة قسرياً
          </button>
        </div>
        <p className="text-[13px] text-gray-500">تغيير الاسم هنا سيقوم بتحديث هويتك في جميع مقالاتك بشكل فوري. في حال واجهت مشكلة من متصفحك في تحديث الأسماء، اضغط على زر "تحديث الصفحة قسرياً".</p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[var(--color-primary-app)]">قائمة تدويناتي ({posts.length})</h2>
        <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
          {posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">لا يوجد لديك تدوينات بعد. ابدأ بكتابة تدبرك الأول!</div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-[#fcfcfc] border-b border-[var(--color-border-app)]">
                <tr>
                  <th className="p-4 font-bold text-gray-700">الآية / العنوان</th>
                  <th className="p-4 font-bold text-gray-700">التصنيف</th>
                  <th className="p-4 font-bold text-gray-700">التاريخ</th>
                  <th className="p-4 font-bold text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-app)]">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <Link to={`/post/${post.id}`} className="hover:text-[var(--color-accent-app)] font-medium text-[var(--color-primary-app)]">
                        ﴿{post.verse}﴾
                      </Link>
                    </td>
                    <td className="p-4 text-gray-600">{post.category}</td>
                    <td className="p-4 text-gray-600">{post.createdAt ? format(post.createdAt.toDate(), 'd MMMM yyyy', { locale: ar }) : ''}</td>
                    <td className="p-4 flex gap-4">
                      <Link to={`/edit/${post.id}`} className="text-[var(--color-accent-app)] font-medium hover:underline">تعديل</Link>
                      <button onClick={() => handleDelete(post.id)} className="text-red-500 font-medium hover:underline">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
