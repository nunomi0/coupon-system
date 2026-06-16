import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * [React Page - Login]
 * 
 * - 사용자 아이디와 비밀번호를 입력받아 로그인을 수행하는 페이지입니다.
 * - 로그인 성공 시, 부모 컴포넌트(App.jsx)에 유저 상태를 전달하여 로그인 상태를 유지하도록 돕습니다.
 */
function Login({ onLoginSuccess }) {
  // [React Router - useNavigate]: 프로그래밍 방식으로 페이지를 이동시키기 위한 훅
  const navigate = useNavigate();

  // [React 상태 관리 - useState]
  // - username: 입력창에 타이핑되는 사용자의 ID
  // - password: 입력창에 타이핑되는 사용자의 비밀번호
  // - loading: 로그인 요청이 백엔드로 전송되어 대기 중일 때(중복 클릭 방지) true가 됨
  // - toast: 사용자에게 띄워줄 알림창 정보 (성공/실패 메세지 객체)
  // - shake: 필수 입력값이 비어있을 때 입력창을 좌우로 흔들게 할 애니메이션 트리거 상태
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [shake, setShake] = useState(false);

  // [로그인 버튼 클릭 / Form Submit 이벤트 핸들러]
  const handleLogin = async (e) => {
    // e.preventDefault(): HTML 폼(form)의 기본 동작인 '새로고침'을 취소합니다. (싱글 페이지 애플리케이션인 React에서는 새로고침 없이 비동기로 통신해야 하기 때문)
    e.preventDefault();

    // 1. 유효성 검사: 입력값 검증
    if (!username.trim() || !password.trim()) {
      setShake(true); // 입력창 흔들림 효과 트리거
      setTimeout(() => setShake(false), 500); // 0.5초 후 흔들림 효과 제거
      setToast({ type: 'error', message: '아이디와 비밀번호를 모두 입력해주세요.' });
      return;
    }

    setLoading(true); // 로딩 상태 활성화 (버튼 비활성화)
    setToast(null);    // 기존 토스트 초기화

    try {
      // 2. 비동기 HTTP POST 통신 (axios)
      // - 백엔드의 '/api/users/login' API로 username과 password를 전송합니다.
      // - await 키워드는 백엔드 서버로부터 응답이 올 때까지 자바스크립트의 실행을 잠시 대기시킵니다.
      const response = await axios.post('/api/users/login', {
        username: username.trim(),
        password: password.trim()
      });

      setToast({ type: 'success', message: '로그인에 성공했습니다!' });
      
      // 3. 약간의 딜레이(0.5초)를 준 후 App.jsx의 user 상태를 성공한 정보로 갱신합니다.
      // - user 정보가 채워지면 App.jsx에 정의된 리다이렉트 조건에 의해 자동으로 쿠폰 화면(`/coupons`)으로 전환됩니다.
      setTimeout(() => {
        onLoginSuccess(response.data); // 부모 컴포넌트에 유저 정보 전달 및 로그인 처리
      }, 500);

    } catch (error) {
      // 4. 에러 예외 처리 (백엔드 에러 응답 수신)
      const errorMsg = error.response?.data?.message || '로그인 중 에러가 발생했습니다.';
      setToast({ type: 'error', message: `❌ ${errorMsg}` });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      // 5. 로딩 완료 처리 (실패/성공 여부와 상관없이 무조건 마지막에 로딩을 꺼줌)
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '420px', margin: '4rem auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0' }}>로그인</h1>
        <p className="sub-text" style={{ margin: 0, fontSize: '0.95rem' }}>선착순 쿠폰 시스템에 오신 것을 환영합니다.</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className={shake && !username.trim() ? 'shake-animation' : ''}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>아이디</label>
          <input
            type="text"
            placeholder="아이디를 입력하세요 (예: user)"
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
            placeholder="비밀번호를 입력하세요 (예: 1234)"
            className="custom-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" className="glow-button" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? '로그인 처리 중...' : '로그인'}
        </button>
      </form>

      {/* 회원가입 페이지 유도 */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
        아직 계정이 없으신가요?{' '}
        <span 
          onClick={() => navigate('/signup')} 
          style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
        >
          회원가입하기
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

export default Login;
