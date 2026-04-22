import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuthors } from '../contexts/AuthorsContext';

interface Post {
  id: string;
  authorName: string;
  authorAvatar?: string;
  verse: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: any;
  authorId?: string;
}

export default function PostView() {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const { authorsMap } = useAuthors();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as Post);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-[18px]">جاري التحميل...</div>;
  
  if (!post) return <div className="text-center py-20 text-red-500">التدوينة غير موجودة.</div>;

  const finalAuthorName = (post.authorId && authorsMap.get(post.authorId)?.displayName) || post.authorName || 'الكاتب';
  const finalAuthorAvatar = (post.authorId && authorsMap.get(post.authorId)?.photoURL) || post.authorAvatar;

  return (
    <div className="flex flex-col gap-[20px]">
      <Link to="/" className="inline-flex items-center text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors text-[14px]">
        العودة للرئيسية
      </Link>
      
      <article className="bg-white border border-[var(--color-border-app)] rounded-[8px] flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="p-[40px] border-b border-[var(--color-border-app)] text-center flex flex-col items-center">
          <span className="text-[13px] text-[var(--color-accent-app)] uppercase tracking-[1px] border-b border-[var(--color-border-app)] pb-[4px] mb-[20px]">
            {post.category}
          </span>
          <h1 className="text-[32px] font-bold text-[var(--color-primary-app)] mb-[20px] leading-[1.4]">
            ﴿ {post.verse} ﴾
          </h1>
          <div className="flex items-center justify-center gap-[15px] text-[14px] text-gray-500">
            {post.authorId && authorsMap.has(post.authorId) ? (
              <Link 
                to={`/?authorId=${authorsMap.get(post.authorId)?.shortId}`} 
                className="flex items-center gap-[10px] hover:bg-gray-50 px-2 py-1 rounded transition-colors cursor-pointer"
                title={`عرض جميع تدوينات ${finalAuthorName}`}
              >
                {finalAuthorAvatar ? (
                  <img src={finalAuthorAvatar} alt={finalAuthorName} className="w-[30px] h-[30px] rounded-full object-cover" />
                ) : (
                  <div className="w-[30px] h-[30px] rounded-full bg-[#ddd] flex items-center justify-center text-[12px] font-bold text-gray-600">
                    {finalAuthorName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="font-medium text-[var(--color-primary-app)] underline decoration-transparent hover:decoration-[var(--color-primary-app)] transition-all">{finalAuthorName}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-[10px]">
                {finalAuthorAvatar ? (
                  <img src={finalAuthorAvatar} alt={finalAuthorName} className="w-[30px] h-[30px] rounded-full object-cover" />
                ) : (
                  <div className="w-[30px] h-[30px] rounded-full bg-[#ddd] flex items-center justify-center text-[12px] font-bold text-gray-600">
                    {finalAuthorName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="font-medium text-[var(--color-primary-app)]">{finalAuthorName}</span>
              </div>
            )}
            <span>•</span>
            {post.createdAt && (
              <time className="text-[14px] text-[#999]">{format(post.createdAt.toDate(), 'd MMMM yyyy', { locale: ar })}</time>
            )}
          </div>
        </div>
        
        <div className="p-[40px]">
          <div className="text-[18px] leading-[1.8] text-[var(--color-text-main)]" dangerouslySetInnerHTML={{ __html: post.content }} />
          
          {post.tags && post.tags.length > 0 && (
            <div className="mt-[30px] pt-[20px] border-t border-[var(--color-border-app)] flex flex-wrap gap-[8px]">
              {post.tags.map((tag, index) => (
                <span key={index} className="bg-white border border-[var(--color-border-app)] px-[10px] py-[4px] rounded-[4px] text-[12px] text-[var(--color-text-main)]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
