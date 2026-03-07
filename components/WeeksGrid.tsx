
import React from 'react';
import { format, addWeeks } from 'date-fns';
import { DiaryEntries, HoverInfo } from '../types';
import { WEEKS_IN_YEAR } from '../constants';

interface WeeksGridProps {
  weeksPassed: number;
  totalYears: number;
  birthdate: string; // ISO string
  onHover: (info: HoverInfo | null) => void;
  onWeekClick: (weekIndex: number, row: number, col: number) => void;
  diaryEntries: DiaryEntries;
  scale: number;
}

interface GridCellProps {
  weekIndex: number;
  row: number;
  col: number;
  isCurrent: boolean;
  isPast: boolean;
  isDecadeMarker: boolean;
  hasDiary: boolean;
  birthdate: string;
  weeksPassedTotal: number;
  diaryEntries: DiaryEntries;
  onHover: (info: HoverInfo | null, event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

const GridCell: React.FC<GridCellProps> = ({ 
  weekIndex, row, col, isCurrent, isPast, isDecadeMarker, hasDiary, 
  birthdate, weeksPassedTotal, diaryEntries, onHover, onMouseLeave, onClick 
}) => {
  
  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!birthdate) return;
    try {
        const birthDateObj = new Date(birthdate);
        if (isNaN(birthDateObj.getTime())) return;

        const startDate = addWeeks(birthDateObj, weekIndex);
        const entry = diaryEntries[weekIndex.toString()];
        const diaryPreview = entry ? entry.substring(0, 50) + (entry.length > 50 ? '...' : '') : null;
        
        let statusText = 'Future';
        let statusTextColor = 'text-text-muted';
        if (isCurrent) {
          statusText = 'Current';
          statusTextColor = 'text-accent';
        } else if (isPast) {
          statusText = 'Past';
          statusTextColor = 'text-primary';
        }

        const tooltipContent = `
          <div class="text-left">
            <div class="font-semibold text-primary mb-0.5 text-[0.9em]">Week ${col + 1}, Year ${row}</div>
            <div class="text-text-muted mb-0.5 text-[0.8em]">${format(startDate, 'MMM d, yyyy')}</div>
            <div class="text-[0.8em] font-medium ${statusTextColor} mb-1">${statusText}</div>
            ${diaryPreview ? `<div class="mt-1 pt-1 border-t border-[rgba(255,255,255,0.15)] italic text-text-main max-w-[200px] max-h-[4.5em] overflow-hidden text-ellipsis text-[0.8em] leading-snug">📝 ${diaryPreview.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ''}
            ${weekIndex <= weeksPassedTotal ? `<div class="mt-1.5 text-[0.75em] text-primary-dark opacity-90">Click to add/edit diary entry</div>` : ''}
          </div>
        `;
        
        const boxElement = event.currentTarget;
        const rect = boxElement.getBoundingClientRect();
        let xPos = rect.left + (rect.width / 2);
        let yPos = rect.top;
        
        const tooltipEstimatedWidth = 200;
        const tooltipEstimatedHeight = 120; // Adjusted for potentially longer content

        let transform = '-translate-x-1/2 -translate-y-[calc(100%+10px)]'; // Default above
        if (yPos - tooltipEstimatedHeight - 10 < 0) { // If not enough space above
            yPos = rect.bottom + 10;
            transform = '-translate-x-1/2 translate-y-[10px]'; // Show below
        } else {
            yPos = rect.top - 10; // Standard yPos for above
        }
       
        onHover({ content: tooltipContent, x: xPos, y: yPos, transform: `transform ${transform}` }, event);
       
    } catch (error) {
        console.error("Error in handleMouseEnter:", error);
        onHover(null, event); // Pass event here as well
    }
  };

  return (
    <div
      className={`
        box w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] lg:w-[22px] lg:h-[22px] m-px box-border border border-box-border 
        bg-bg-light transition-all duration-200 ease-in-out relative cursor-pointer rounded-[2px]
        hover:scale-125 hover:border-primary hover:z-10 hover:shadow-lg hover:shadow-primary/30
        focus:outline-none focus:ring-2 focus:ring-primary focus:z-10
        ${isPast ? `bg-primary shadow-sm shadow-primary/20` : ''}
        ${isCurrent ? `bg-accent !border-accent shadow-md shadow-accent/40 animate-pulse-slow z-[5]` : ''}
        ${isDecadeMarker ? `before:content-[''] before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-0.5 before:bg-decade-marker before:opacity-70 before:z-[1]` : ''}
        ${hasDiary ? `after:content-['📝'] after:absolute after:text-[9px] after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:opacity-70 after:pointer-events-none` : ''}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && weekIndex <= weeksPassedTotal) onClick(); }}
      role="button"
      tabIndex={0}
      aria-label={`Week ${col + 1}, Year ${row}. Status: ${isCurrent ? 'Current' : isPast ? 'Past' : 'Future'}${hasDiary ? '. Contains diary entry.' : ''}`}
    ></div>
  );
};


const WeeksGrid: React.FC<WeeksGridProps> = ({ weeksPassed, totalYears, birthdate, onHover, onWeekClick, diaryEntries, scale }) => {
  if (totalYears <= 0 || totalYears > 120) {
    return <div className="text-text-muted text-center p-4">Invalid life expectancy. Please enter a value between 1 and 120.</div>;
  }

  const gridRef = React.useRef<HTMLDivElement>(null);
  
  const handleCellHover = (info: HoverInfo | null, event: React.MouseEvent<HTMLDivElement>) => {
    onHover(info);
  };
  
  const handleCellMouseLeave = () => {
    onHover(null);
  };

  return (
    <div className="relative w-full overflow-x-auto -webkit-overflow-scrolling-touch mb-4 sm:mb-6">
      <div 
        ref={gridRef}
        className="inline-block transition-transform duration-300 ease-out origin-top-left"
        style={{ transform: `scale(${scale})`, width: scale < 1 ? `${(1/scale) * 100}%` : 'auto' }}
      >
        <div className="inline-flex flex-col animate-fade-in min-w-min mx-auto border border-box-border p-0.5 sm:p-1 bg-[rgba(0,0,0,0.05)] rounded-sm">
          {/* Header Row */}
          <div className="flex items-center gap-px">
            <div className="corner min-w-[22px] sm:min-w-[25px] lg:min-w-[28px] h-[18px] sm:h-[20px] lg:h-[22px] text-[8px] sm:text-[9px] lg:text-[10px]"></div> {/* Corner */}
            {Array.from({ length: WEEKS_IN_YEAR }, (_, i) => (
              <div key={`header-week-${i}`} className="week-label text-primary font-medium text-[8px] sm:text-[9px] lg:text-[10px] h-[18px] sm:h-[20px] lg:h-[22px] w-[18px] sm:w-[20px] lg:w-[22px] flex items-center justify-center bg-[rgba(0,0,0,0.1)] rounded-[2px]">
                {i + 1}
              </div>
            ))}
          </div>
          {/* Grid Rows */}
          {Array.from({ length: totalYears }, (_, row) => (
            <div key={`year-row-${row}`} className="flex items-center gap-px">
              <div className="year-label text-primary font-medium min-w-[22px] sm:min-w-[25px] lg:min-w-[28px] h-[18px] sm:h-[20px] lg:h-[22px] text-[9px] sm:text-[10px] lg:text-[11px] flex items-center justify-center pr-1">
                {row}
              </div>
              {Array.from({ length: WEEKS_IN_YEAR }, (_, col) => {
                const weekIndex = row * WEEKS_IN_YEAR + col;
                const isCurrent = weekIndex === weeksPassed;
                const isPast = weekIndex < weeksPassed;
                const isDecadeMarker = row > 0 && row % 10 === 0 && col === 0;
                const hasDiary = !!diaryEntries[weekIndex.toString()];
                return (
                  <GridCell
                    key={`week-box-${row}-${col}`}
                    weekIndex={weekIndex}
                    row={row}
                    col={col}
                    isCurrent={isCurrent}
                    isPast={isPast}
                    isDecadeMarker={isDecadeMarker}
                    hasDiary={hasDiary}
                    birthdate={birthdate}
                    weeksPassedTotal={weeksPassed}
                    diaryEntries={diaryEntries} 
                    onHover={handleCellHover}
                    onMouseLeave={handleCellMouseLeave}
                    onClick={() => { if (weekIndex <= weeksPassed) onWeekClick(weekIndex, row, col); }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeksGrid;