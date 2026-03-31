import { memo, useEffect, useMemo, useState } from 'react';
import { useBIMStore } from '../../store';
import { Loader2, Search, X } from 'lucide-react';

const SearchInput = memo(() => {
  const searchQuery = useBIMStore((s) => s.searchQuery) ?? '';
  const setSearchQuery = useBIMStore((s) => s.setSearchQuery);
  const spatialTreeById = useBIMStore((s) => s.spatialTreeById);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const isSearching = localSearch !== searchQuery && localSearch.trim() !== '';

  const resultCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const query = searchQuery.toLowerCase();
    return Object.values(spatialTreeById).filter(
      (node) =>
        !node.isGroup &&
        node.type !== 'IFCBUILDINGSTOREY' &&
        node.label.toLowerCase().includes(query)
    ).length;
  }, [spatialTreeById, searchQuery]);

  useEffect(() => {
    if (localSearch === searchQuery) return;
    const timer = setTimeout(() => {
      if (typeof setSearchQuery === 'function') {
        setSearchQuery(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery, searchQuery]);

  // Đồng bộ localSearch khi searchQuery từ store thay đổi (ví dụ khi clear)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleClearSearch = () => {
    setLocalSearch('');
    if (typeof setSearchQuery === 'function') {
      setSearchQuery('');
    }
  };

  return (
    <div className='flex flex-col'>
      <div className='relative flex items-center'>
        {isSearching ? (
          <Loader2 className='absolute left-2.5 w-3.5 h-3.5 text-bim-primary animate-spin' />
        ) : (
          <Search className='absolute left-2.5 w-3.5 h-3.5 text-bim-text-muted/70' />
        )}
        <input
          type='text'
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder='Search elements...'
          className='w-full bg-bim-bg-main/50 border border-bim-border-light rounded-md py-1.5 pl-8 pr-8 text-[11px] text-bim-text-main placeholder:text-bim-text-muted/50 focus:outline-none focus:border-bim-primary/50 transition-colors'
        />
        {localSearch && (
          <button
            onClick={handleClearSearch}
            className='absolute right-2 p-0.5 hover:bg-bim-bg-item-hover rounded-full text-bim-text-muted hover:text-bim-text-main transition-colors'
          >
            <X className='w-3 h-3' />
          </button>
        )}
      </div>

      {searchQuery && !isSearching && (
        <div className='mt-1.5 px-1 flex items-center gap-1.5 text-[10px] text-bim-text-muted'>
          <p>
            Found{' '}
            <span className='text-bim-text-main font-semibold'>
              {resultCount.toLocaleString()}
            </span>{' '}
            results for '{searchQuery}'
          </p>
        </div>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;
