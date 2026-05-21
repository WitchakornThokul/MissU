import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Bottom-sheet modal ที่ขยับขึ้นอัตโนมัติเมื่อ keyboard เปิด
 * ใช้ visualViewport API เพื่อตรวจจับ keyboard height บน iOS และ Android
 */
export default function BottomSheet({ show, onClose, title, children }) {
  const [kbOffset, setKbOffset] = useState(0);

  useEffect(() => {
    if (!show) { setKbOffset(0); return; }
    if (!window.visualViewport) return;

    function update() {
      const vv = window.visualViewport;
      // offset = ส่วนที่ keyboard บัง (ความสูงหน้าจอ - ความสูง viewport ที่เห็นอยู่)
      const hidden = window.innerHeight - (vv.height + vv.offsetTop);
      setKbOffset(Math.max(0, hidden));
    }

    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    update();
    return () => {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="animate-slide-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          background: 'white',
          borderRadius: '28px 28px 0 0',
          padding: '20px 24px max(32px,env(safe-area-inset-bottom))',
          maxHeight: '90vh',
          overflowY: 'auto',
          // ขยับขึ้นตาม keyboard
          transform: `translateY(-${kbOffset}px)`,
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, marginTop: -4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e5e7eb' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
          >
            <FiX size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
