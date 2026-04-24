import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';
import { useAuthors } from '../contexts/AuthorsContext';

interface Post {
  id: string;
  authorName?: string;
  authorAvatar?: string;
  verse: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: any;
  authorId?: string;
}

export default function Home() {
  const { authorsMap, authorsByShortId } = useAuthors();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const authorIdFilter = searchParams.get('authorId'); // Now acts as shortId essentially when from sidebar
  const catFilter = searchParams.get('category');
  const tagFilter = searchParams.get('tag');

  useEffect(() => {
    setLoading(true);
    setAllPosts([]); // Clear to show loading state
    // Remove onSnapshot and use getDocs or use the same onSnapshot but re-triggered by refreshKey
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedPosts: Post[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
      });
      setAllPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Home posts listener Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshKey]);

  const displayAuthorName = useMemo(() => {
    if (!authorIdFilter) return null;
    const author = authorsByShortId.get(Number(authorIdFilter)) || Array.from(authorsMap.values()).find(a => a.shortId.toString() === authorIdFilter);
    return author ? author.displayName : 'الكاتب';
  }, [authorIdFilter, authorsByShortId, authorsMap]);

  const posts = useMemo(() => {
    let p = allPosts;
    if (authorIdFilter) {
       const targetAuthor = authorsByShortId.get(Number(authorIdFilter)) || Array.from(authorsMap.values()).find(a => a.shortId.toString() === authorIdFilter);
       if (targetAuthor) {
          p = p.filter(x => x.authorId === targetAuthor.uid || (!x.authorId && x.authorName === targetAuthor.displayName));
       }
    }
    if (catFilter) p = p.filter(x => x.category === catFilter);
    if (tagFilter) p = p.filter(x => x.tags?.includes(tagFilter));
    return p;
  }, [allPosts, authorIdFilter, catFilter, tagFilter, authorsByShortId, authorsMap]);

  const clearFilters = () => {
    setSearchParams({});
  };

  if (loading) {
    return <div className="text-center py-20 text-[18px]">جاري تحميل التدوينات...</div>;
  }

  const hasFilters = authorIdFilter || catFilter || tagFilter;

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold text-[var(--color-primary-app)]"></h1>
        <button 
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="flex items-center gap-[8px] bg-white border border-[var(--color-border-app)] px-[12px] py-[8px] rounded-[6px] text-gray-600 hover:text-[var(--color-accent-app)] hover:border-[var(--color-accent-app)] transition-colors shadow-sm text-[14px] font-bold"
          title="تحديث قسري"
        >
          <RefreshCw size={16} className={loading && allPosts.length === 0 ? "animate-spin" : ""} />
          <span>تحديث المقالات</span>
        </button>
      </div>

      {hasFilters && (
        <div className="bg-white border border-[var(--color-border-app)] p-[15px] rounded-[8px] flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-[10px] text-[15px]">
            <span className="text-gray-500">تصفية حسب:</span>
            {authorIdFilter && <span className="font-bold text-[var(--color-primary-app)]">الكاتب ({displayAuthorName})</span>}
            {catFilter && <span className="font-bold text-[var(--color-primary-app)]">التصنيف ({catFilter})</span>}
            {tagFilter && <span className="font-bold text-[var(--color-primary-app)]">الوسم (#{tagFilter})</span>}
          </div>
          <button 
            onClick={clearFilters}
            className="text-[13px] text-[var(--color-accent-app)] hover:underline"
          >
            إلغاء التصفية
          </button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-primary-app)] text-[18px]">لا توجد تدوينات مطابقة.</div>
      ) : (
        posts.map((post) => {
          const finalAuthorName = (post.authorId && authorsMap.get(post.authorId)?.displayName) || post.authorName || 'الكاتب';
          const finalAuthorAvatar = (post.authorId && authorsMap.get(post.authorId)?.photoURL) || post.authorAvatar;
          
          return (
            <article key={post.id} className="bg-white border border-[var(--color-border-app)] rounded-[8px] p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col gap-[15px]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--color-accent-app)] uppercase tracking-[1px] border-b border-[var(--color-border-app)] pb-[4px]">
                  {post.category}
                </span>
                {post.createdAt && (
                  <time className="text-[12px] text-[#999]">
                    {format(post.createdAt.toDate(), 'd MMMM yyyy', { locale: ar })}
                  </time>
                )}
              </div>
              
              <Link to={`/post/${post.id}`} className="block block group">
                <h2 className="text-[24px] font-bold text-[var(--color-primary-app)] group-hover:text-[var(--color-accent-app)] transition-colors line-height-[1.4]">
                  في قوله تعالى: ﴿{post.verse}﴾
                </h2>
              </Link>

              <div className="line-clamp-3 text-[16px] leading-[1.8] text-[var(--color-text-main)]" dangerouslySetInnerHTML={{ __html: post.content }} />

              <div className="flex flex-wrap items-center justify-between gap-4 pt-[15px] border-t border-[var(--color-border-app)]">
                <div className="flex items-center gap-[10px]">
                  {finalAuthorAvatar ? (
                    <img src={finalAuthorAvatar} alt={finalAuthorName} className="w-[30px] h-[30px] rounded-full object-cover" />
                  ) : (
                    <div className="w-[30px] h-[30px] rounded-full bg-[#ddd] flex items-center justify-center text-[12px] font-bold text-gray-600">
                      {finalAuthorName.charAt(0)}
                    </div>
                  )}
                  <span className="text-[14px] font-medium text-[var(--color-primary-app)]">{finalAuthorName}</span>
                </div>
                
                <div className="flex gap-[8px]">
                  {post.tags?.map((tag, index) => (
                    <span key={index} className="bg-white border border-[var(--color-border-app)] px-[10px] py-[4px] rounded-[4px] text-[12px] text-[var(--color-text-main)] transition-colors hover:text-[var(--color-accent-app)] cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          )
        })
      )}
    </div>
  );
}
