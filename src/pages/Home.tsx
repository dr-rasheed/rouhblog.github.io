import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Post {
  id: string;
  authorName: string;
  authorAvatar?: string;
  verse: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: any;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedPosts: Post[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
        });
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-[18px]">جاري تحميل التدوينات...</div>;
  }

  return (
    <div className="flex flex-col gap-[20px]">
      {posts.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-primary-app)] text-[18px]">لا توجد تدوينات بعد.</div>
      ) : (
        posts.map((post) => (
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
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt={post.authorName} className="w-[30px] h-[30px] rounded-full object-cover" />
                ) : (
                  <div className="w-[30px] h-[30px] rounded-full bg-[#ddd] flex items-center justify-center text-[12px] font-bold text-gray-600">
                    {post.authorName.charAt(0)}
                  </div>
                )}
                <span className="text-[14px] font-medium text-[var(--color-primary-app)]">{post.authorName}</span>
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
        ))
      )}
    </div>
  );
}
