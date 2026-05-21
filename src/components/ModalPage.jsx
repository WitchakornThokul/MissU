import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

/**
 * Full-screen modal page wrapper
 * ใช้แทน Navbar + PageHeader สำหรับทุกหน้า activity
 * - backdrop เบลอ กดปิดได้
 * - header gradient พร้อมปุ่มย้อนกลับ
 * - content area scroll ได้
 * - actionBtn: node แสดงที่มุมขวาบน header (optional)
 */
export default function ModalPage({ title, subtitle, from, to, bg, children, actionBtn }) {
  const navigate = useNavigate();
  const [kbOffset, setKbOffset] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;
    function update() {
      const vv = window.visualViewport;
      const hidden = window.innerHeight - (vv.height + vv.offsetTop);
      setKbOffset(Math.max(0, hidden));
    }
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        onClick={() => navigate(-1)}
      />
      <div
        className="animate-slide-up"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 51,
          maxWidth: 560, margin: '0 auto',
          background: bg || 'white',
          borderRadius: '28px 28px 0 0',
          height: '92vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          transform: `translateY(-${kbOffset}px)`,
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Drag handle */}
        <div style={{
          background: `linear-gradient(135deg,${from},${to})`,
          paddingTop: 10, paddingBottom: 0, flexShrink: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.45)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 18px',
          background: `linear-gradient(135deg,${from},${to})`,
          flexShrink: 0,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="text-center" style={{ flex: 1 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{title}</p>
            {subtitle && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', margin: 0 }}>{subtitle}</p>}
          </div>
          <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>
            {actionBtn || null}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px max(32px,env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </div>
    </>
  );
}
