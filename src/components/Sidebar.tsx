import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SidebarProps {
  isAllowed: boolean;
}

export default function Sidebar({ isAllowed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authors, setAuthors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(['تدبر آية', 'لطائف لغوية', 'أسباب النزول', 'مقاصد السور']);
  const [tags, setTags] = useState<string[]>(['السكينة', 'تأملات', 'القرآن', 'لغة', 'إعجاز']);
  
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
        const snap = await getDocs(q);
        const auths = new Set<string>();
        const tgs = new Set<string>();
        const cats = new Set<string>();
        
        snap.forEach(doc => {
          const data = doc.data();
          if (data.authorName) auths.add(data.authorName);
          if (data.category) cats.add(data.category);
          if (data.tags && Array.isArray(data.tags)) {
            data.tags.forEach((t: string) => tgs.add(t));
          }
        });
        
        if (auths.size > 0) setAuthors(Array.from(auths));
        if (cats.size > 0) setCategories(Array.from(cats));
        if (tgs.size > 0) setTags(Array.from(tgs).slice(0, 15));
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
      }
    };
    fetchSidebarData();
  }, [location.pathname]);

  const handleFilter = (type: string, value: string) => {
    navigate({
      pathname: '/',
      search: `?${type}=${encodeURIComponent(value)}`
    });
  };

  return (
    <aside className="w-[260px] bg-[var(--color-sidebar-bg)] border-l border-[var(--color-border-app)] p-[25px] flex flex-col gap-[30px] overflow-y-auto shrink-0">
      <div className="flex flex-col">
        <h3 className="text-[13px] uppercase tracking-[1px] text-[var(--color-accent-app)] mb-[15px] border-b border-[var(--color-border-app)] pb-[5px]">روابط سريعة</h3>
        <ul className="list-none flex flex-col">
          <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">
            <Link to="/" className="w-full block">الرئيسية</Link>
          </li>
          {isAllowed && (
            <li className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors">
              <Link to="/write" className="w-full block">إضافة تدوينة</Link>
            </li>
          )}
        </ul>
      </div>
      
      {authors.length > 0 && (
        <div className="flex flex-col">
          <h3 className="text-[13px] uppercase tracking-[1px] text-[var(--color-accent-app)] mb-[15px] border-b border-[var(--color-border-app)] pb-[5px]">الكُتّاب المعتمدين</h3>
          <ul className="list-none flex flex-col">
            {authors.map((author, i) => (
              <li 
                key={i} 
                onClick={() => handleFilter('author', author)}
                className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors"
              >
                {author}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col">
        <h3 className="text-[13px] uppercase tracking-[1px] text-[var(--color-accent-app)] mb-[15px] border-b border-[var(--color-border-app)] pb-[5px]">التصنيفات</h3>
        <ul className="list-none flex flex-col">
          {categories.map((cat, i) => (
            <li 
              key={i} 
              onClick={() => handleFilter('category', cat)}
              className="py-[8px] text-[15px] cursor-pointer text-[var(--color-primary-app)] hover:text-[var(--color-accent-app)] transition-colors"
            >
              {cat}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="flex flex-col">
        <h3 className="text-[13px] uppercase tracking-[1px] text-[var(--color-accent-app)] mb-[15px] border-b border-[var(--color-border-app)] pb-[5px]">الأوسمة الشائعة</h3>
        <div className="flex flex-wrap gap-[8px]">
          {tags.map((tag, i) => (
            <span 
              key={i}
              onClick={() => handleFilter('tag', tag)}
              className="bg-white border border-[var(--color-border-app)] px-[10px] py-[4px] rounded-[4px] text-[12px] cursor-pointer hover:border-[var(--color-accent-app)] hover:text-[var(--color-accent-app)] transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
