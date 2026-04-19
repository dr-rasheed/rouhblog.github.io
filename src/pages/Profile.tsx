import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { updateProfile, User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Post {
  id: string;
  verse: string;
  category: string;
  createdAt: any;
  authorId: string;
}

export default function Profile({ user, isAllowed }: { user: User | null, isAllowed: boolean }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editableName, setEditableName] = useState(user?.displayName || user?.email || '');
  const [savingName, setSavingName] = useState(false);

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
      const q = query(collection(db, 'posts'), where('authorId', '==', user.uid));
      const snap = await getDocs(q);
      const p: Post[] = [];
      snap.forEach(d => p.push({ id: d.id, ...d.data() } as Post));
      // Client side sort to bypass Firebase index requirements
      p.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPosts(p);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleNameSave = async () => {
    const newName = editableName.trim();
    if (!user || !newName || newName === user.displayName) return;
    const oldName = user.displayName || '';
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: newName });
      const batch = writeBatch(db);
      const updatedRefs = new Set<string>();

      const snapAll = await getDocs(collection(db, 'posts'));
      snapAll.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const isMatch = data.authorId === user.uid || !data.authorId || (oldName && data.authorName === oldName) || data.authorName === user.email;
        if (isMatch) {
          batch.update(docSnapshot.ref, { authorName: newName, authorId: user.uid });
          updatedRefs.add(docSnapshot.id);
        }
      });
      if (updatedRefs.size > 0) await batch.commit();
      window.location.reload(); // Refresh the app to show new name everywhere
    } catch (error) {
      console.error(error);
      setSavingName(false);
      alert("حدث خطأ أثناء حفظ الاسم.");
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
            disabled={savingName || editableName === user?.displayName}
            className="bg-[var(--color-primary-app)] text-white px-6 py-[9px] rounded font-bold disabled:opacity-50 hover:bg-opacity-90 font-[15px]"
          >
            {savingName ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
        <p className="text-[13px] text-gray-500">تغيير الاسم هنا سيقوم بتحديث جميع مقالاتك السابقة لتظهر بالاسم الجديد.</p>
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
