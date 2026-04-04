interface MapControlsProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReset: () => void;
}

/*
  Floating UI controls for the mini-map.
  Handles zoom resetting and map expansion.
*/
export const MapControls = ({
  isExpanded,
  onToggleExpand,
  onReset,
}: MapControlsProps) => {
  const btnStyle: React.CSSProperties = {
    width: '30px',
    height: '30px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'background-color 0.2s',
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}
    >
      <button
        onClick={onToggleExpand}
        style={btnStyle}
        title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
        aria-label={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
      >
        {isExpanded ? (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='#333'
            strokeWidth='2'
          >
            <path d='M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7' />
          </svg>
        ) : (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='#333'
            strokeWidth='2'
          >
            <path d='M15 3h6m0 0v6m0-6L14 10M9 21H3m0 0v-6m0 6l7-7' />
          </svg>
        )}
      </button>

      <button onClick={onReset} style={btnStyle} title='Quay lại node hiện tại'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='lucide lucide-locate-fixed-icon lucide-locate-fixed'
        >
          <line x1='2' x2='5' y1='12' y2='12' />
          <line x1='19' x2='22' y1='12' y2='12' />
          <line x1='12' x2='12' y1='2' y2='5' />
          <line x1='12' x2='12' y1='19' y2='22' />
          <circle cx='12' cy='12' r='7' />
          <circle cx='12' cy='12' r='3' />
        </svg>
      </button>
    </div>
  );
};
