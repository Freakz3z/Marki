import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNavigation } from '../services/docs';

export const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to first document found in SUMMARY
    const init = async () => {
        const nav = await getNavigation();
        
        // Helper to find first leaf
        const findFirst = (items: any[]): string | null => {
            for (const item of items) {
                if (!item.children || item.children.length === 0) return item.path;
                const childResult = findFirst(item.children);
                if (childResult) return childResult;
            }
            return null;
        }

        const firstDoc = findFirst(nav);
        if (firstDoc) {
          navigate(`/view${firstDoc}`, { replace: true });
        }
    };
    init();
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};
