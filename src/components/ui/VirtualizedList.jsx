import React, { memo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

/**
 * VirtualizedList - A performant list component for rendering large datasets
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function to render each item: (item, index, style) => JSX
 * @param {number} itemHeight - Height of each item in pixels
 * @param {string} className - Additional CSS classes for the container
 * @param {number} overscanCount - Number of items to render outside visible area
 */
const VirtualizedList = memo(({ 
  items = [], 
  renderItem, 
  itemHeight = 80,
  className = '',
  overscanCount = 5,
  minHeight = 400
}) => {
  const listRef = useRef(null);

  // Reset scroll position when items change significantly
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [items.length]);

  if (!items.length) {
    return null;
  }

  // For small lists (< 20 items), just render normally without virtualization
  if (items.length < 20) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={item.id || index}>
            {renderItem(item, index, {})}
          </div>
        ))}
      </div>
    );
  }

  const Row = ({ index, style }) => {
    const item = items[index];
    if (!item) return null;
    
    return (
      <div style={style}>
        {renderItem(item, index, style)}
      </div>
    );
  };

  return (
    <div className={className} style={{ height: Math.min(items.length * itemHeight, minHeight) }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height || minHeight}
            width={width || '100%'}
            itemCount={items.length}
            itemSize={itemHeight}
            overscanCount={overscanCount}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList;
