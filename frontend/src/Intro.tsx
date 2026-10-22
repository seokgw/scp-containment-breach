import { useState } from "react";
import { ArrowRight, Fingerprint, LockKeyhole, Shield } from "lucide-react";
import "./intro.css";

export function Intro({
  onLogin,
  onRegister,
}: {
  onLogin: (codename: string, password: string) => Promise<void>;
  onRegister: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="intro-page">
      <section className="intro-scene" aria-label="제17 기지 입구">
        <img
          className="intro-image"
          src="/images/site17-entrance.png"
          alt="긴 어두운 격리시설 복도 끝에 서 있는 한 명의 요원"
          fetchPriority="high"
        />
        <div className="intro-scene-shade" />
        <a href="/" className="intro-brand">
          <span>
            <Shield size={26} strokeWidth={1.4} />
          </span>
          <div>
            SCP FOUNDATION<small>SECURE. CONTAIN. PROTECT.</small>
          </div>
        </a>
        <div className="intro-coordinate">
          <span>CAM 017 — NORTH CORRIDOR</span>
          <span>
            <i /> SIGNAL RESTORED
          </span>
        </div>
        <div className="intro-scene-caption">
          <span className="intro-file-number">INCIDENT FILE / 2026-10-22</span>
          <p>
            누군가 문을 열었다.
            <br />
            그리고, 당신이 도착했다.
          </p>
          <div>
            <span>SITE ██-17</span>
            <span>03:17:02 KST</span>
          </div>
        </div>
        <div className="intro-scene-bottom">
          <span>RESTRICTED AREA</span>
          <span>AUTHORIZED PERSONNEL ONLY</span>
        </div>
      </section>
      <section className="intro-content">
        <header className="intro-topline">
          <span>FOUNDATION SECURE ACCESS</span>
          <span>
            <i /> 비상 대응 체계 가동
          </span>
        </header>
        <div className="intro-body">
          <div className="intro-alert">
            <span /> CONTAINMENT BREACH DETECTED
          </div>
          <p className="intro-eyebrow">SCP: CONTAINMENT BREACH</p>
          <h1>
            격리 실패.
            <br />
            진실은 <em>기록</em> 속에 있다.
          </h1>
          <p className="intro-description">
            기지 제██-17의 통제 시스템이 무너졌다.
            <br />
            정보보안 분석관 K-17이 되어, 남겨진 증거를 추적하라.
          </p>
          <div className="intro-facts">
            <span>
              <b>01</b> ACT
            </span>
            <span>
              <b>10</b> 조사 임무
            </span>
            <span>
              <b>03</b> 격리 구역
            </span>
          </div>
          <section className="intro-login" aria-labelledby="intro-login-title">
            <div className="intro-login-heading">
              <Fingerprint size={21} />
              <div>
                <h2 id="intro-login-title">요원 인증</h2>
                <p>신원을 확인하고 통제 시스템에 접속하세요.</p>
              </div>
              <LockKeyhole size={15} />
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                const data = new FormData(e.currentTarget);
                try {
                  await onLogin(
                    String(data.get("codename")),
                    String(data.get("password")),
                  );
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label htmlFor="intro-codename">
                코드명 <span>AGENT CODENAME</span>
              </label>
              <input
                id="intro-codename"
                name="codename"
                autoComplete="username"
                required
                minLength={3}
                maxLength={24}
                placeholder="agent-k17"
                disabled={busy}
              />
              <label htmlFor="intro-password">
                비밀번호 <span>ACCESS KEY</span>
              </label>
              <input
                id="intro-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={10}
                maxLength={72}
                placeholder="비밀번호를 입력하세요"
                disabled={busy}
              />
              {error && (
                <p className="intro-login-error" role="alert">
                  {error}
                </p>
              )}
              <button className="intro-submit" disabled={busy}>
                {busy ? "신원 확인 중…" : "로그인 · 통제실 진입"}
                <ArrowRight size={17} />
              </button>
            </form>
            <div className="intro-register">
              <span>아직 등록된 요원이 아닌가요?</span>
              <button onClick={onRegister} disabled={busy}>
                새 요원 등록 <ArrowRight size={12} />
              </button>
            </div>
          </section>
        </div>
        <footer className="intro-footer">
          <span>
            <LockKeyhole size={11} /> 보안 교육용 스토리 워게임
          </span>
          <a
            href="https://github.com/seokgw/scp-containment-breach/blob/main/ATTRIBUTION.md"
            target="_blank"
            rel="noreferrer"
          >
            비공식 SCP 팬 창작 · CC BY-SA 3.0
          </a>
        </footer>
      </section>
    </div>
  );
}
