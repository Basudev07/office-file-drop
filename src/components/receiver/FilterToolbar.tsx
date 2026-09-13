import React from 'react';
import { Search } from 'lucide-react';

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Files' },
  { id: 'image', label: 'Images' },
  { id: 'pdf', label: 'PDFs' },
  { id: 'document', label: 'Docs' },
  { id: 'spreadsheet', label: 'Sheets' },
  { id: 'archive', label: 'Zip' },
  { id: 'code', label: 'Code & Text' },
];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
}) => {
  return (
    <div className="filter-toolbar">
      <div className="search-input-wrap">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="input-field search-input"
          placeholder="Search by sender or file name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="category-chips-scroll">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`btn btn-sm ${categoryFilter === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            onClick={() => onCategoryFilterChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
