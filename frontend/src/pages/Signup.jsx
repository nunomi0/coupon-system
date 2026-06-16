import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * [React Page - Signup]
 * 
 * - 새로운 사용자 계정을 등록하는 페이지입니다.
 * - 아이디, 비밀번호와 함께 회원 권한(일반 사용자 / 관리자)을 선택할 수 있도록 구현되어 있습니다.
 */
function Signup() {
  // [React Router - useNavigate]: 가입 후 로그인 화면으로 전환시키기 위한 라우팅 훅
  const navigate = useNavigate();

  // [React 상태 관리 - useState]
  // - username: 입력창에 타이핑되는 사용자의 ID
  // - password: 입력창에 타이핑되는 사용자의 비밀번호
  // - role: 권한 유형 ('USER' 또는 'ADMIN', 라디오 버튼 클릭으로 제어)
  // - loading: 백엔드로 회원가입 요청 중일 때의 상태 (버튼 잠금 처리)
  // - toast: 처리 결과 알림 정보
  // - shake: 필수값 미입력 시 에러 애니메이션 트리거
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [shake, setShake] = useState(false);

  // 회원가입 전송 이벤트 핸들러
  const handleSignup = async (e) => {
    // 폼 전송 시의 웹브라우저 강제 새로고침 방지
    e.preventDefault();

    // 1. 필수값 비었는지 유효성 검사
    if (!username.trim() || !password.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setToast({ type: 'error', message: '모든 필드를 입력해 주세요.' });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      // 2. 백엔드 회원가입 API 통신
      // - '/api/users/signup' 엔드포인트로 사용자 이름, 암호, 권한 정보를 객체에 실어 보냅니다.
      await axios.post('/api/users/signup', {
        username: username.trim(),
        password: password.trim(),
        role: role
      });

      setToast({ type: 'success', message: '🎉 회원가입에 성공했습니다! 로그인 페이지로 이동합니다...' });
      
      // 3. 성공 알림창을 사용자가 읽을 수 있도록 1.5초(1500ms) 대기 시간을 준 뒤 로그인 화면(`/login`)으로 이동시킵니다.
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      // 4. 실패 예외 처리 (이미 가입된 아이디 등의 경우에 백엔드에서 내려준 메세지 수신)
      const errorMsg = error.response?.data?.message || '회원가입 중 에러가 발생했습니다.';
      setToast({ type: 'error', message: `❌ ${errorMsg}` });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      // 5. 버튼 로딩 상태 해제
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '420px', margin: '4rem auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0' }}>회원가입</h1>
        <p className="sub-text" style={{ margin: 0, fontSize: '0.95rem' }}>선착순 쿠폰 시스템의 계정을 생성합니다.</p>
      </div>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className={shake && !username.trim() ? 'shake-animation' : ''}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>아이디</label>
          <input
            type="text"
            placeholder="새로운 아이디를 입력하세요"
            className="custom-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={shake && !password.trim() ? 'shake-animation' : ''}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>비밀번호</label>
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            className="custom-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* 권한 등급 선택 (ADMIN/USER) */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>가입 권한</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem',
              borderRadius: '12px',
              border: `1px solid ${role === 'USER' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}`,
              background: role === 'USER' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="role"
                value="USER"
                checked={role === 'USER'}
                onChange={() => setRole('USER')}
                style={{ display: 'none' }}
              />
              일반 사용자 (USER)
            </label>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem',
              borderRadius: '12px',
              border: `1px solid ${role === 'ADMIN' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}`,
              background: role === 'ADMIN' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="role"
                value="ADMIN"
                checked={role === 'ADMIN'}
                onChange={() => setRole('ADMIN')}
                style={{ display: 'none' }}
              />
              관리자 (ADMIN)
            </label>
          </div>
        </div>

        <button type="submit" className="glow-button" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? '가입 처리 중...' : '회원가입'}
        </button>
      </form>

      {/* 로그인 페이지 유도 */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
        이미 계정이 있으신가요?{' '}
        <span 
          onClick={() => navigate('/login')} 
          style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
        >
          로그인하기
        </span>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default Signup;
