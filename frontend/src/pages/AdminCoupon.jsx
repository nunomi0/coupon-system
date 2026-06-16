import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * [React Page - AdminCoupon]
 * 
 * - 관리자(ADMIN)만 접근하여 신규 쿠폰을 등록하는 화면입니다.
 * - 신규 쿠폰 생성 양식 및 현재 DB에 등록되어 있는 쿠폰들의 전체 목록을 테이블 형태로 시각화합니다.
 */
function AdminCoupon({ user }) {
  // [React 상태 관리 - useState]
  // - name: 새로 등록할 쿠폰 이름
  // - totalQuantity: 새로 등록할 쿠폰 총 발급 수량
  // - loading: 등록 진행 상태 (버튼 비활성화 제어)
  // - toast: 알림 정보 메시지
  // - coupons: 현재 DB에 등록되어 표시할 전체 쿠폰 목록
  const [name, setName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [coupons, setCoupons] = useState([]);

  // DB에 존재하는 전체 쿠폰 목록을 조회하여 테이블에 채우는 비동기 함수
  const fetchCoupons = async () => {
    try {
      const response = await axios.get('/api/coupons');
      setCoupons(response.data); // 최신 목록을 가져와 테이블 리렌더링
    } catch (error) {
      console.error('쿠폰 목록 로드 실패:', error);
    }
  };

  // 컴포넌트가 처음 생성(마운트)될 때 딱 한 번 실행하여 기존 쿠폰 목록 로드
  useEffect(() => {
    fetchCoupons();
  }, []);

  // [신규 쿠폰 등록 Form Submit 이벤트 핸들러]
  const handleCreateCoupon = async (e) => {
    // 폼 제출 시 브라우저 새로고침(기본동작) 방지
    e.preventDefault();

    // 1. 유효성 검증: 빈 값 체크
    if (!name.trim() || !totalQuantity) {
      setToast({ type: 'error', message: '쿠폰 이름과 발급 수량을 모두 입력해 주세요.' });
      return;
    }

    // 2. 숫자로 변환 처리 (parseInt) 및 수량 유효성 체크
    const qty = parseInt(totalQuantity);
    if (isNaN(qty) || qty <= 0) {
      setToast({ type: 'error', message: '발급 수량은 1장 이상이어야 합니다.' });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      // 3. 백엔드 쿠폰 생성 API 호출
      // - 쿠폰 이름, 수량과 함께 현재 로그인한 관리자의 ID(user.id)를 보냅니다.
      // - 백엔드는 전달받은 adminId의 사용자가 진짜 관리자 권한을 가졌는지 검증한 후 쿠폰을 등록합니다.
      await axios.post('/api/coupons', {
        name: name.trim(),
        totalQuantity: qty,
        adminId: user.id
      });

      setToast({ type: 'success', message: '🎉 새 선착순 쿠폰이 정상적으로 등록되었습니다!' });
      
      // 4. 등록 완료 후 입력 폼 초기화 및 리스트 갱신
      setName('');
      setTotalQuantity('');
      fetchCoupons(); // 목록 데이터를 다시 받아와 화면 갱신
    } catch (error) {
      const errorMsg = error.response?.data?.message || '쿠폰 등록 도중 오류가 발생했습니다.';
      setToast({ type: 'error', message: `❌ ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <span className="badge badge-info" style={{ marginBottom: '0.75rem', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#ec4899' }}>ADMIN PANEL</span>
        <h1 className="gradient-text" style={{ fontSize: '2.4rem', margin: '0 0 0.5rem 0' }}>쿠폰 관리자 모드</h1>
        <p className="sub-text" style={{ margin: 0, fontSize: '1rem' }}>관리자 권한으로 선착순 쿠폰을 새로 생성하고 관리할 수 있습니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* 쿠폰 생성 Form 카드 */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 0, marginBottom: '1.5rem', color: '#fff' }}>새 쿠폰 등록하기</h2>
          <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>쿠폰 이름</label>
              <input
                type="text"
                placeholder="예: 선착순 100명 1만원 할인 쿠폰"
                className="custom-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>전체 발급 수량 (장)</label>
              <input
                type="number"
                placeholder="예: 100"
                className="custom-input"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" className="glow-button" disabled={loading} style={{ background: 'linear-gradient(90deg, #ec4899, #be185d)', boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)' }}>
              {loading ? '등록 중...' : '쿠폰 등록 완료'}
            </button>
          </form>
        </div>

        {/* 현재 쿠폰 현황 테이블 카드 */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 0, marginBottom: '1.5rem', color: '#fff' }}>등록된 쿠폰 현황</h2>
          
          {coupons.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>등록된 쿠폰이 없습니다.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontWeight: 500 }}>ID</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontWeight: 500 }}>쿠폰명</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontWeight: 500 }}>남은수량 / 총수량</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontWeight: 500 }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{coupon.id}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{coupon.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{coupon.remainingQuantity} / {coupon.totalQuantity}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {coupon.remainingQuantity <= 0 ? (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>소진완료</span>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>발급가능</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, marginTop: 0 }}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default AdminCoupon;
