import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAuthors } from "../contexts/AuthorsContext";
import { User } from "firebase/auth";

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: any;
}

export default function Comments({ postId, user, postAuthorId }: { postId: string, user: User | null, postAuthorId?: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { authorsMap } = useAuthors();

  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comms: Comment[] = [];
      snapshot.forEach((doc) => {
        comms.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(comms);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setSubmitting(true);
    try {
      const isVerified = user.emailVerified;
      if (!isVerified) {
         alert("يجب تفعيل بريدك الإلكتروني لتتمكن من التعليق.");
         setSubmitting(false);
         return;
      }
      
      const authorProfile = authorsMap.get(user.uid);
      const finalName = authorProfile?.displayName || user.displayName || 'مستخدم';
      const finalAvatar = authorProfile?.photoURL || user.photoURL || '';

      await addDoc(collection(db, "posts", postId, "comments"), {
        authorId: user.uid,
        authorName: finalName,
        authorAvatar: finalAvatar,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (error: any) {
      console.error("Error adding comment: ", error);
      alert("حدث خطأ أثناء إضافة التعليق: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
      try {
        await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    }
  };

  return (
    <div className="mt-8 border-t border-[var(--color-border-app)] pt-8">
      <h3 className="text-[20px] font-bold text-[var(--color-primary-app)] mb-6">التعليقات ({comments.length})</h3>
      
      <div className="flex flex-col gap-6 mb-8">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-[#fcfcfc] border border-gray-100 rounded-[8px] p-4 relative group">
             <div className="flex items-center gap-3 mb-2">
                {comment.authorAvatar ? (
                  <img src={comment.authorAvatar} alt={comment.authorName} className="w-[30px] h-[30px] rounded-full object-cover" />
                ) : (
                  <div className="w-[30px] h-[30px] rounded-full bg-[#eee] flex items-center justify-center text-[12px] font-bold text-gray-500">
                    {comment.authorName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                    <span className="font-bold text-[14px] text-[var(--color-primary-app)] block leading-none">{comment.authorName}</span>
                    <span className="text-[12px] text-gray-400">
                      {comment.createdAt ? format(comment.createdAt.toDate(), 'd MMMM yyyy - h:mm a', { locale: ar }) : 'الآن'}
                    </span>
                </div>
                
                {(user?.uid === comment.authorId || user?.uid === postAuthorId) && (
                    <button 
                       onClick={() => handleDelete(comment.id)}
                       className="absolute top-4 left-4 text-gray-400 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                       title="حذف التعليق"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                )}
             </div>
             <p className="text-[14px] leading-relaxed text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          </div>
        ))}

        {comments.length === 0 && (
            <p className="text-gray-400 text-[14px] text-center italic">لا توجد تعليقات بعد، كن أول من يعلق!</p>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="أضف تعليقاً يثري التدبر..."
            className="w-full px-4 py-3 border border-gray-200 rounded-[8px] outline-none focus:border-[var(--color-accent-app)] focus:ring-1 focus:ring-[var(--color-accent-app)] min-h-[100px] text-[14px] resize-y"
            required
            maxLength={5000}
          />
          <button 
            type="submit" 
            disabled={submitting || !newComment.trim()}
            className="bg-[var(--color-accent-app)] text-white px-6 py-2 rounded-[6px] font-bold text-[14px] self-end hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال التعليق'}
          </button>
        </form>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-[8px] p-4 text-center">
          <p className="text-[14px] text-gray-600">يجب عليك تسجيل الدخول لتتمكن من إضافة تعليق.</p>
        </div>
      )}
    </div>
  );
}
