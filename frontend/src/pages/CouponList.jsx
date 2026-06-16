import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * [React Page - CouponList]
 * 
 * - 사용자가 발급 가능한 모든 쿠폰의 리스트를 실시간으로 확인하고 신청할 수 있는 화면입니다.
 * - 3초 주기 폴링(Polling)을 수행하여 여러 사람이 발급 시 변경되는 잔여 수량을 실시간 갱신합니다.
 */
function CouponList({ user }) {
  // [React 상태 관리 - useState]
  // - coupons: 백엔드에서 로드한 전체 쿠폰 목록 배열
  // - loadingMap: 각 쿠폰 번호별로 발급 신청 진행 여부를 저장하는 맵 객체 { [couponId]: true/false }
  //               (여러 개의 버튼 중 자신이 클릭한 버튼만 로딩 표시를 하기 위함)
  // - fetching: 화면 최초 진입 시, 로딩 표시를 위한 상태값
  // - toast: 처리 결과 알림 정보
  const [coupons, setCoupons] = useState([]);
  const [loadingMap, setLoadingMap] = useState({}); 
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);

  // 백엔드로부터 최신 선착순 쿠폰 정보 목록을 읽어오는 함수
  const fetchCoupons = async () => {
    try {
      const response = await axios.get('/api/coupons');
      // 백엔드가 제공한 JSON 데이터를 coupons 상태에 업데이트 (화면 리렌더링 발생)
      setCoupons(response.data);
      setFetching(false);
    } catch (error) {
      console.error('쿠폰 목록 조회 실패:', error);
      setFetching(false);
    }
  };

  // [React Lifecycle Hook - useEffect]
  // - 컴포넌트가 화면에 마운트(처음 나타남)되거나 언마운트(사라짐)될 때 실행될 사이드 이펙트를 정의합니다.
  // - 두 번째 인자인 의존성 배열(dependency array)이 비어있으면 `[]`, 컴포넌트가 생성될 때 딱 한 번만 콜백 함수가 작동합니다.
  useEffect(() => {
    // 1. 화면이 열리자마자 즉시 쿠폰 목록 조회 실행
    fetchCoupons();

    // 2. 다른 사용자가 쿠폰을 받아 수량이 닳는 것을 보여주기 위해 3초(3000ms) 간격으로 목록을 재조회하는 타이머 가동 (폴링)
    const interval = setInterval(fetchCoupons, 3000);

    // 3. [중요 - 클린업 함수]
    // - 컴포넌트가 화면에서 사라질 때(예: 다른 페이지로 이동) 타이머를 정지시킵니다.
    // - 정지하지 않으면 브라우저 메모리에 타이머가 누적되어 성능 저하 및 에러를 유발합니다.
    return () => clearInterval(interval);
  }, []);

  // 쿠폰 발급 신청 처리 함수
  const handleIssueCoupon = async (couponId) => {
    // 특정 쿠폰 ID에 해당하는 버튼의 로딩 상태를 true로 전환
    setLoadingMap(prev => ({ ...prev, [couponId]: true }));
    setToast(null);

    try {
      // POST 통신: 특정 쿠폰에 대해 현재 사용자의 username으로 선착순 발급 요청 전송
      await axios.post(`/api/coupons/${couponId}/issue`, {
        username: user.username
      });

      setToast({ type: 'success', message: '🎉 쿠폰 발급에 성공했습니다! DB에 이력이 등록되었습니다.' });
      fetchCoupons(); // 발급에 성공하면 즉시 화면의 수량을 최신화하기 위해 강제 재호출
    } catch (error) {
      const errorMsg = error.response?.data?.message || '쿠폰 발급에 실패했습니다.';
      setToast({ type: 'error', message: `❌ ${errorMsg}` });
    } finally {
      // 통신 완료(성공/실패 무관) 시 해당 쿠폰의 로딩을 false로 풀어줌
      setLoadingMap(prev => ({ ...prev, [couponId]: false }));
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge badge-info" style={{ marginBottom: '0.75rem' }}>선착순 발급 진행 중</span>
        <h1 className="gradient-text" style={{ fontSize: '2.4rem', margin: '0 0 0.5rem 0' }}>쿠폰 리스트</h1>
        <p className="sub-text" style={{ margin: 0, fontSize: '1rem' }}>아래 쿠폰 리스트에서 원하는 쿠폰을 신청해 보세요!</p>
      </div>

      {fetching ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          쿠폰 목록을 조회하는 중입니다...
        </div>
      ) : coupons.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#94a3b8', margin: '0 0 1.5rem 0' }}>등록된 선착순 쿠폰이 아직 없습니다.</p>
          {user.role === 'ADMIN' && (
            <p style={{ color: '#818cf8', fontSize: '0.9rem' }}>상단 메뉴의 '쿠폰 관리자' 탭을 통해 신규 쿠폰을 등록해 주세요!</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {coupons.map((coupon) => {
            const progress = (coupon.remainingQuantity / coupon.totalQuantity) * 100;
            const isSoldOut = coupon.remainingQuantity <= 0;
            const isButtonLoading = loadingMap[coupon.id] || false;

            return (
              <div key={coupon.id} className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>{coupon.name}</h2>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>등록번호: #{coupon.id}</span>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: isSoldOut ? '#ef4444' : '#818cf8' }}>
                    {coupon.remainingQuantity} / {coupon.totalQuantity} 장 남음
                  </span>
                </div>

                {/* 프로그레스 바 */}
                <div className="progress-container" style={{ marginBottom: '1.5rem' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${progress}%`,
                      background: isSoldOut ? '#ef4444' : 'linear-gradient(90deg, #818cf8, #6366f1)'
                    }}
                  ></div>
                </div>

                {/* 발급 신청 버튼 */}
                <button
                  onClick={() => handleIssueCoupon(coupon.id)}
                  className="glow-button"
                  disabled={isSoldOut || isButtonLoading}
                  style={{
                    background: isSoldOut ? '#334155' : 'linear-gradient(90deg, #6366f1, #4f46e5)'
                  }}
                >
                  {isButtonLoading ? (
                    '발급 처리 중...'
                  ) : isSoldOut ? (
                    '쿠폰 소진 완료'
                  ) : (
                    '쿠폰 발급 받기'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, marginTop: 0 }}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default CouponList;
