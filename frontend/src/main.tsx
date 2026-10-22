import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Fingerprint,
  FlaskConical,
  LockKeyhole,
  LogOut,
  Menu,
  Radio,
  Shield,
  Terminal,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import "./styles.css";
import { Intro } from "./Intro";
import {
  EvidenceScene,
  FacilityRoute,
  SceneThumb,
  SectorBanner,
} from "./Investigation";
import { chapterZones, getScene, zones } from "./story";
import "./foundation.css";
type Doc = {
  id: string;
  title: string;
  scp: string;
  objectClass: string;
  containment: string;
  description: string;
  incident: string;
  researcher: string;
  clearance: number;
};
type Challenge = {
  id: number;
  title: string;
  category: string;
  points: number;
  difficulty: number;
  difficultyLabel: string;
  chapterId: number;
  description: string;
  objective: string;
  attachment: string | null;
  challengeType: string;
};
type Chapter = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  requiredClearance: number;
  ids: number[];
};
type Act = {
  id: number;
  title: string;
  range: string;
  difficulty: string;
  releaseStatus: string;
};
type Me = {
  user: { codename: string; createdAt: string; role: "agent" | "admin" };
  accessClearance: number;
  score: number;
  clearance: number;
  solved: number[];
  documents: Doc[];
  completed: boolean;
  ending: string | null;
  hints: { challengeId: number; level: number }[];
};
type Ranking = { codename: string; score: number; solved: number };
const num = (id: number) => String(id).padStart(3, "0");
async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch("/api" + path, {
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : {},
    ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
  });
  const b = await r.json();
  if (!r.ok) throw Error(b.error || "시스템 연결 오류");
  return b;
}
function App() {
  const [catalog, setCatalog] = useState<{
      challenges: Challenge[];
      chapters: Chapter[];
      acts: Act[];
    } | null>(null),
    [me, setMe] = useState<Me | null>(null),
    [page, setPage] = useState(location.hash.slice(1) || "overview"),
    [auth, setAuth] = useState<false | "login" | "register">(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [mobile, setMobile] = useState(false),
    [selected, setSelected] = useState<Challenge | null>(null),
    [rankings, setRankings] = useState<Ranking[]>([]),
    [doc, setDoc] = useState<Doc | null>(null),
    [showEnding, setShowEnding] = useState(false);
  const refresh = async () => {
    try {
      const result = await api<Me>("/me");
      setMe(result);
      return result;
    } catch {
      setMe(null);
      return null;
    }
  };
  useEffect(() => {
    api<NonNullable<typeof catalog>>("/catalog")
      .then(setCatalog)
      .catch((e) => setError(e.message));
    void refresh();
    const listener = () => {
      setPage(location.hash.slice(1) || "overview");
      setSelected(null);
      setMobile(false);
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    if (page === "rankings")
      api<{ rankings: Ranking[] }>("/rankings")
        .then((b) => setRankings(b.rankings))
        .catch((e) => setError(e.message));
  }, [page]);
  function go(view: string) {
    window.scrollTo({ top: 0, behavior: "instant" });
    location.hash = view;
    setPage(view);
    setSelected(null);
    setMobile(false);
  }
  function start() {
    if (!me) setAuth("register");
    else go("briefing");
  }
  function openChallenge(c: Challenge) {
    if (!me) {
      setAuth("login");
      return;
    }
    const ch = catalog?.chapters.find((ch) => ch.id === c.chapterId);
    if (ch && me.accessClearance < ch.requiredClearance) {
      setError("이전 챕터를 완료해 보안 인가를 획득하세요.");
      return;
    }
    setSelected(c);
    go("missions");
    setSelected(c);
  }
  const nav = [
    ["overview", "통제 대시보드", Activity],
    ["briefing", "임무 브리핑", Radio],
    ["missions", "조사 임무", Terminal],
    ["documents", "기밀문서", FileText],
    ["rankings", "요원 랭킹", Trophy],
    ["profile", "요원 프로필", Fingerprint],
    ...(me?.user.role === "admin" ? [["admin", "관리자 콘솔", Shield] as const] : []),
  ] as const;
  const clearance = me?.clearance || 0;
  const isAdmin = me?.user.role === "admin";
  const accessClearance = me?.accessClearance ?? clearance;
  const currentZone = selected
    ? getScene(selected.id).zone
    : page === "documents"
      ? "research"
      : page === "missions"
        ? chapterZones[Math.min(clearance + 1, 3)]
        : "control";
  const zone = zones[currentZone];
  function visitChapter(chapter: number) {
    if (accessClearance < chapter - 1) {
      setError("이전 챕터를 완료해 보안 인가를 획득하세요.");
      return;
    }
    go("missions");
    requestAnimationFrame(() =>
      document.getElementById(`chapter-${chapter}`)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      }),
    );
  }
  return (
    <div className="app">
      {me ? (
        <>
          <aside className={mobile ? "sidebar open" : "sidebar"}>
            <a className="brand" href="#overview" aria-label="SCP 재단 홈">
              <span className="brand-mark">
                <Shield size={28} />
              </span>
              <span>
                SCP FOUNDATION<small>SECURE. CONTAIN. PROTECT.</small>
              </span>
            </a>
            <div className="sidebar-label">
              SITE ██-17 <span>INTERNAL NETWORK</span>
            </div>
            <nav>
              {nav.map(([id, label, Icon]) => (
                <button
                  key={id}
                  className={page === id ? "nav-item active" : "nav-item"}
                  onClick={() => go(id)}
                >
                  <Icon size={18} />
                  {label}
                  {id === "missions" && <span className="nav-count">10</span>}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="connection">
                <i /> 비상 네트워크 연결됨
              </div>
              <div className="agent-mini">
                <div className="avatar">
                  <UserRound size={18} />
                </div>
                <div>
                  <b>{me?.user.codename || "미등록 요원"}</b>
                  <small>{isAdmin ? "ADMIN · ALL ACCESS" : `SECURITY LEVEL ${clearance}`}</small>
                </div>
                {me ? (
                  <button
                    className="icon-button"
                    aria-label="로그아웃"
                    onClick={async () => {
                      try {
                        await api("/auth/logout", {});
                        setMe(null);
                        setSelected(null);
                        go("overview");
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    <LogOut size={16} />
                  </button>
                ) : (
                  <button
                    className="icon-button"
                    aria-label="로그인"
                    onClick={() => setAuth("login")}
                  >
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </aside>
          <div
            className="workspace"
            data-zone={currentZone}
            style={
              {
                "--facility-scene": `url(${zone.image})`,
              } as React.CSSProperties
            }
          >
            <header className="topbar">
              <div>
                <button
                  className="icon-button mobile-menu"
                  aria-label="메뉴 열기"
                  onClick={() => setMobile(!mobile)}
                >
                  <Menu size={20} />
                </button>
                <span className="breadcrumb">
                  FOUNDATION INTRANET <ChevronRight size={12} />
                  <b>
                    {nav.find((n) => n[0] === page)?.[1] || "통제 대시보드"}
                  </b>
                </span>
              </div>
              <div className="topbar-right">
                <span className="live-dot" /> 비상 대응 프로토콜 가동{" "}
                <span className="level-tag">
                  <LockKeyhole size={12} /> LEVEL {clearance}
                </span>
              </div>
            </header>
            <main>
              <div className="alert-strip">
                <span>
                  <Radio size={15} /> SITE-WIDE ALERT
                </span>
                <p>
                  제██-17 기지 격리 실패 발생 · 모든 인원은 비상 대응 절차를
                  따르십시오.
                </p>
                <b>CODE RED</b>
              </div>
              <div className="location-ticker">
                <span>
                  <i />
                  {selected ? getScene(selected.id).room : zone.label}
                </span>
                <span>{zone.code} / FIELD INVESTIGATION ACTIVE</span>
              </div>
              {error && (
                <div className="error-banner" role="alert">
                  {error}
                  <button
                    className="icon-button"
                    onClick={() => setError("")}
                    aria-label="알림 닫기"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {!catalog ? (
                <div className="panel loading">
                  보안 네트워크 연결 중…
                  {error && (
                    <button onClick={() => location.reload()}>다시 연결</button>
                  )}
                </div>
              ) : selected ? (
                <ChallengeView
                  key={selected.id}
                  c={selected}
                  me={me!}
                  refresh={refresh}
                  back={() => go("missions")}
                  ending={() => setShowEnding(true)}
                  next={(id) => {
                    const next = catalog.challenges.find((c) => c.id === id);
                    if (next) openChallenge(next);
                  }}
                />
              ) : (
                <>
                  {page === "overview" && (
                    <>
                      <div className="page-kicker">
                        <span>EMERGENCY OPERATIONS CENTER</span>
                        <span>2026.10.22 / INCIDENT 03:17 KST</span>
                      </div>
                      <section className="hero">
                        <div className="hero-copy">
                          <div className="status-pill">
                            <i /> CONTAINMENT BREACH DETECTED
                          </div>
                          <h1>
                            격리는 실패했다.
                            <br />
                            <span>기록은 남아 있다.</span>
                          </h1>
                          <p>
                            누군가 문을 열었다. 그리고 흔적을 지웠다.
                            <br />
                            정보보안 분석관 K-17, 지금부터 사건을 재구성하라.
                          </p>
                          <button className="primary" onClick={start}>
                            조사 임무 시작 <ArrowRight size={17} />
                          </button>
                          <small className="hero-note">
                            ACT I · 10개의 조사 임무 · 입문자를 위한 보안 워게임
                          </small>
                        </div>
                        <div
                          className="hero-visual"
                          aria-label="제17기지 마지막 CCTV 수신 화면"
                        >
                          <div className="visual-label">CAM 173-B / ARCHIVE FRAME <b>SIGNAL LOST · 03:17:21</b></div>
                        </div>
                      </section>
                      <FacilityRoute
                        solved={me.solved}
                        clearance={accessClearance}
                        onChapter={visitChapter}
                      />
                      <section className="stats-grid">
                        <Stat
                          label="전체 격리 개체"
                          value="12"
                          unit="ENTITIES"
                          icon={<Shield />}
                        />
                        <Stat
                          label="격리 실패"
                          value="07"
                          unit="BREACHED"
                          danger
                          icon={<Activity />}
                        />
                        <Stat
                          label="중앙 통제 시스템"
                          value="OFFLINE"
                          unit="CONNECTION LOST"
                          danger
                          icon={<Radio />}
                        />
                        <Stat
                          label="내 보안 인가"
                          value={"LEVEL " + clearance}
                          unit={
                            me
                              ? me.user.codename.toUpperCase()
                              : "ACCESS RESTRICTED"
                          }
                          icon={<Fingerprint />}
                        />
                      </section>
                      <div className="dashboard-grid">
                        <section className="panel mission-panel">
                          <SectionTitle
                            kicker="CURRENT OPERATION"
                            title="조사 구역"
                            right={
                              <button
                                className="text-button"
                                onClick={() => go("missions")}
                              >
                                전체 임무 <ArrowRight size={14} />
                              </button>
                            }
                          />
                          <div className="chapter-stack">
                            {catalog.chapters.map((ch) => (
                              <ChapterCard
                                key={ch.id}
                                ch={ch}
                                me={me}
                                onClick={() => {
                                  go("missions");
                                }}
                              />
                            ))}
                          </div>
                        </section>
                        <section className="panel log-panel">
                          <SectionTitle
                            kicker="SYSTEM EVENT LOG"
                            title="비상 시스템 로그"
                            right={
                              <span className="tiny-red">
                                <i /> INCIDENT RECORD
                              </span>
                            }
                          />
                          <div className="terminal-log">
                            <p className="terminal-intro">
                              site17@emergency:~$ tail incident.log
                            </p>
                            {[
                              ["03:17:02", "중앙 제어 시스템 오류", "ERR"],
                              [
                                "03:17:08",
                                "SCP-173 격리 구역 응답 없음",
                                "WARN",
                              ],
                              ["03:17:15", "미인가 접근 감지", "ERR"],
                              ["03:17:21", "CCTV 연결 종료", "ERR"],
                              ["03:17:34", "관리자 명령 실행", "WARN"],
                            ].map(([time, text, kind]) => (
                              <div className="log-row" key={time}>
                                <time>{time}</time>
                                <span
                                  className={
                                    kind === "ERR" ? "log-err" : "log-warn"
                                  }
                                >
                                  [{kind}]
                                </span>
                                <p>{text}</p>
                              </div>
                            ))}
                            <div className="log-message">
                              &gt; 격리 실패는 사고가 아니다.
                              <br />
                              &gt; 누군가 문을 열었다.
                              <span className="cursor">▊</span>
                            </div>
                          </div>
                          <div className="log-footer">
                            <LockKeyhole size={13} /> 원본 로그 복원 필요{" "}
                            <span>5 EVENTS</span>
                          </div>
                        </section>
                      </div>
                      <section className="progress-banner">
                        <div>
                          <span className="square-icon">
                            <BookOpen size={22} />
                          </span>
                          <div>
                            <b>사건의 첫 번째 장을 열어라.</b>
                            <p>
                              10개의 증거를 연결해 PROJECT BLACK VEIL의 흔적을
                              추적하세요.
                            </p>
                          </div>
                        </div>
                        <div className="progress-summary">
                          <b>
                            {me?.solved.length || 0}
                            <span> / 10 임무 완료</span>
                          </b>
                          <div className="progress-track">
                            <i
                              style={{
                                width: `${(me?.solved.length || 0) * 10}%`,
                              }}
                            />
                          </div>
                        </div>
                      </section>
                    </>
                  )}
                  {page === "briefing" && (
                    <>
                      <PageTitle
                        kicker="OPERATION BRIEFING"
                        title="기지 제██-17 격리 실패 사건"
                        description="이것은 단순한 시스템 장애가 아니다. 남겨진 증거를 따라 사건을 조사하라."
                      />
                      <section className="panel briefing">
                        <div className="classified-label">
                          TOP SECRET / EYES ONLY
                        </div>
                        <h2>정보보안 분석관 K-17에게</h2>
                        <p>
                          2026년 10월 22일 03시 17분, 전체 12개 격리 구역 중 7개
                          구역의 통제 시스템이 종료되었습니다. 감시 카메라는
                          멈췄고, 관리자 명령 기록은 지워졌습니다.
                        </p>
                        <blockquote>
                          “격리 실패는 사고가 아니다.”
                          <br />
                          “누군가 문을 열었다.”
                        </blockquote>
                        <p>
                          웹 소스와 통신, 파일, 로그를 분석해 실제 증거를
                          복원하세요. 각 임무에서 찾은 FLAG를 제출하면
                          기밀문서와 다음 조사 구역이 해금됩니다.
                        </p>
                        <dl className="detail-grid">
                          <div>
                            <dt>코드명</dt>
                            <dd>{me?.user.codename || "등록 대기"}</dd>
                          </div>
                          <div>
                            <dt>소속</dt>
                            <dd>재단 정보보안 분석팀</dd>
                          </div>
                          <div>
                            <dt>배치 시설</dt>
                            <dd>SITE ██-17</dd>
                          </div>
                          <div>
                            <dt>보안 인가</dt>
                            <dd>LEVEL {clearance}</dd>
                          </div>
                        </dl>
                        <p className="muted">
                          허가된 게임 자료와 격리 실습 환경만 조사하세요. 운영
                          사이트를 공격할 필요는 없습니다. 006 IDOR 임무는 로컬
                          Docker 실습을 사용합니다.
                        </p>
                        <button
                          className="primary"
                          onClick={() =>
                            me ? go("missions") : setAuth("register")
                          }
                        >
                          브리핑 확인 · 조사 시작 <ArrowRight size={16} />
                        </button>
                      </section>
                    </>
                  )}
                  {page === "missions" && (
                    <>
                      <PageTitle
                        kicker="ACT I / INVESTIGATION"
                        title="조사 임무"
                        description="작은 단서부터 시작하세요. 모든 임무에 세 단계의 힌트가 제공됩니다."
                      />
                      <FacilityRoute
                        solved={me.solved}
                        clearance={accessClearance}
                        onChapter={visitChapter}
                      />
                      <div className="mission-legend">
                        <span>
                          <i className="legend-dot green" /> AVAILABLE
                        </span>
                        <span>
                          <Check size={13} /> COMPLETED
                        </span>
                        <span>
                          <LockKeyhole size={13} /> LOCKED
                        </span>
                        <b>{me?.score || 0} / 2,250 PT</b>
                      </div>
                      {catalog.chapters.map((ch) => (
                        <section
                          className="chapter-section"
                          id={`chapter-${ch.id}`}
                          key={ch.id}
                        >
                          <div className="chapter-heading">
                            <span>CHAPTER 0{ch.id}</span>
                            <h2>{ch.title}</h2>
                            <small>
                              LEVEL {ch.requiredClearance} →{" "}
                              {ch.requiredClearance + 1}
                            </small>
                          </div>
                          <SectorBanner chapter={ch.id} solved={me.solved} />
                          <div className="challenge-grid">
                            {catalog.challenges
                              .filter((c) => c.chapterId === ch.id)
                              .map((c) => {
                                const locked = accessClearance < ch.requiredClearance,
                                  solved = me?.solved.includes(c.id);
                                return (
                                  <button
                                    className={
                                      "challenge-card " +
                                      (locked
                                        ? "locked"
                                        : solved
                                          ? "solved"
                                          : "")
                                    }
                                    key={c.id}
                                    onClick={() => openChallenge(c)}
                                    aria-label={`${num(c.id)} ${c.title}${locked ? " 잠김" : ""}`}
                                  >
                                    <SceneThumb id={c.id} />
                                    <div className="challenge-top">
                                      <span>MISSION {num(c.id)}</span>
                                      {locked ? (
                                        <LockKeyhole size={16} />
                                      ) : solved ? (
                                        <Check size={18} />
                                      ) : (
                                        <ArrowRight size={16} />
                                      )}
                                    </div>
                                    <h3>{c.title}</h3>
                                    <p>{c.category}</p>
                                    <div className="challenge-bottom">
                                      <span>
                                        {c.difficultyLabel}{" "}
                                        <span className="difficulty-dots">
                                          {"▰".repeat(c.difficulty)}
                                          {"▱".repeat(3 - c.difficulty)}
                                        </span>
                                      </span>
                                      <b>
                                        {c.points} <small>PT</small>
                                      </b>
                                    </div>
                                    {solved && (
                                      <span className="solved-label">
                                        COMPLETED
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                          </div>
                        </section>
                      ))}
                      <SectionTitle
                        kicker="FUTURE OPERATIONS"
                        title="다음 조사 기록"
                      />
                      <div className="future-acts">
                        {catalog.acts
                          .filter((a) => a.releaseStatus === "planned")
                          .map((a) => (
                            <div className="panel future-act" key={a.id}>
                              <LockKeyhole size={22} />
                              <span>
                                ACT {a.id} / {a.range}
                              </span>
                              <h3>{a.title}</h3>
                              <p>{a.difficulty}</p>
                              <small>준비 중 · 현재 미구현</small>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                  {page === "documents" && (
                    <>
                      <PageTitle
                        kicker="CLASSIFIED ARCHIVE"
                        title="SCP 기밀문서"
                        description="임무에서 검증한 증거만 열람할 수 있습니다. 각 문서는 본 게임을 위해 작성한 창작 기록입니다."
                      />
                      <div className="documents-grid">
                        {catalog.challenges.map((c) => {
                          const unlocked = me?.documents.find(
                            (d) => d.id === "DOC-" + num(c.id),
                          );
                          return (
                            <button
                              key={c.id}
                              className={
                                "panel document-card " +
                                (!unlocked ? "locked" : "")
                              }
                              onClick={() =>
                                unlocked
                                  ? setDoc(unlocked)
                                  : setError(
                                      "관련 임무를 완료하면 문서가 해금됩니다.",
                                    )
                              }
                            >
                              <div className="document-cover">
                                <img src={getScene(c.id).image} alt="" loading="lazy" />
                                <span>FOUNDATION ARCHIVE / {num(c.id)}</span>
                              </div>
                              <div>
                                <FileText size={25} />
                                {unlocked ? (
                                  <span className="green-text">
                                    DECLASSIFIED
                                  </span>
                                ) : (
                                  <LockKeyhole size={16} />
                                )}
                              </div>
                              <small>DOC-{num(c.id)}</small>
                              <h3>{unlocked?.title || "[접근 권한 부족]"}</h3>
                              <p>
                                {unlocked
                                  ? unlocked.scp
                                  : `MISSION ${num(c.id)} 완료 필요`}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {page === "rankings" && (
                    <>
                      <PageTitle
                        kicker="PERSONNEL LEADERBOARD"
                        title="요원 랭킹"
                        description="점수 내림차순, 동점은 마지막 정답 제출이 빠른 순입니다. 공개 식별 정보는 코드명뿐입니다."
                      />
                      <section className="panel ranking-panel">
                        <div className="ranking-row ranking-head">
                          <span>RANK</span>
                          <span>AGENT CODENAME</span>
                          <span>SOLVED</span>
                          <span>SCORE</span>
                        </div>
                        {rankings.length ? (
                          rankings.map((r, i) => (
                            <div
                              key={r.codename}
                              className={
                                "ranking-row " +
                                (r.codename === me?.user.codename
                                  ? "my-rank"
                                  : "")
                              }
                            >
                              <b>{String(i + 1).padStart(2, "0")}</b>
                              <span>
                                <UserRound size={16} />
                                {r.codename}
                                {r.codename === me?.user.codename && (
                                  <small>YOU</small>
                                )}
                              </span>
                              <span>{r.solved} / 10</span>
                              <b>{Number(r.score).toLocaleString()} PT</b>
                            </div>
                          ))
                        ) : (
                          <div className="empty-state">
                            <Trophy size={35} />
                            <h3>첫 번째 조사관을 기다립니다.</h3>
                            <p>
                              요원을 등록하고 증거를 검증해 랭킹에 이름을
                              올리세요.
                            </p>
                          </div>
                        )}
                      </section>
                    </>
                  )}
                  {page === "admin" && isAdmin && (
                    <>
                      <PageTitle kicker="SITE-17 ADMINISTRATION" title="관리자 콘솔" description="모든 공개 임무·해설·기밀문서를 열람할 수 있습니다. 관리자 열람은 풀이 기록에 반영되지 않으며 랭킹에서 제외됩니다." />
                      <section className="panel profile-docs">
                        <h3>전체 조사 임무 · {catalog.challenges.length}</h3>
                        {catalog.challenges.map(c => <button className="document-link" key={c.id} onClick={() => openChallenge(c)}><Shield size={16} />{num(c.id)} / {c.title}<ChevronRight size={16} /></button>)}
                        <button className="secondary" onClick={() => go("documents")}>전체 기밀문서 열람</button>{" "}
                        <button className="primary" onClick={() => setShowEnding(true)}>ACT I 엔딩 열람</button>
                      </section>
                    </>
                  )}
                  {page === "profile" && (
                    <>
                      <PageTitle
                        kicker="AGENT PERSONNEL FILE"
                        title="요원 프로필"
                        description="보안 인가와 진행 기록은 서버에서 검증하고 저장합니다."
                      />
                      {me ? (
                        <>
                          <div className="profile-grid">
                            <section className="panel agent-card">
                              <Fingerprint size={52} />
                              <span>FOUNDATION SECURITY CLEARANCE</span>
                              <h2>{me.user.codename}</h2>
                              <strong>LEVEL {clearance}</strong>
                              <p>정보보안 분석관 / SITE ██-17</p>
                              <small>
                                등록일{" "}
                                {new Date(me.user.createdAt).toLocaleDateString(
                                  "ko-KR",
                                )}
                              </small>
                            </section>
                            <section className="panel profile-progress">
                              <Stat
                                label="획득 점수"
                                value={me.score.toLocaleString()}
                                unit="/ 2,250 PT"
                              />
                              <Stat
                                label="해결 임무"
                                value={String(me.solved.length)}
                                unit="/ 10 MISSIONS"
                              />
                              {catalog.chapters.map((ch) => (
                                <ChapterCard
                                  key={ch.id}
                                  ch={ch}
                                  me={me}
                                  onClick={() => go("missions")}
                                />
                              ))}
                            </section>
                          </div>
                          <div className="panel profile-docs">
                            <h3>해금한 문서 · {me.documents.length}</h3>
                            {me.documents.length ? (
                              me.documents.map((d) => (
                                <button
                                  className="document-link"
                                  key={d.id}
                                  onClick={() => setDoc(d)}
                                >
                                  <FileText size={16} />
                                  {d.id} / {d.title}
                                  <ChevronRight size={16} />
                                </button>
                              ))
                            ) : (
                              <p className="muted">
                                첫 임무를 완료하면 조사 기록이 해금됩니다.
                              </p>
                            )}
                            {(me.completed || isAdmin) && (
                              <button
                                className="primary"
                                onClick={() => setShowEnding(true)}
                              >
                                ACT I 엔딩 다시 보기 <ArrowRight size={16} />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <section className="panel empty-state">
                          <Fingerprint size={45} />
                          <h3>요원 인증이 필요합니다.</h3>
                          <button
                            className="primary"
                            onClick={() => setAuth("login")}
                          >
                            로그인 <ArrowRight size={16} />
                          </button>
                        </section>
                      )}
                    </>
                  )}
                </>
              )}
              <footer>
                <span>
                  SCP FOUNDATION <i /> SITE ██-17 / TRAINING SYSTEM v1.0
                </span>
                <span>
                  SCP Wiki 기반 비공식 팬 창작 ·{" "}
                  <a
                    href="#license"
                    onClick={(e) => {
                      e.preventDefault();
                      setDoc({
                        id: "LICENSE",
                        title: "저작자 표시 및 라이선스",
                        scp: "SCP Wiki",
                        objectClass: "CC BY-SA 3.0",
                        clearance: 0,
                        containment:
                          "본 사이트는 SCP 재단의 비공식 팬 창작입니다. 기존 SCP-173 조각상 이미지는 사용하지 않습니다.",
                        description:
                          "SCP-173: Moto42 / SCP-049: Gabriel Jade, rewritten by djkaktus & Gabriel Jade / SCP-079: Unknown author (원문 표기). 각 원문 링크와 상세 표시는 저장소의 ATTRIBUTION.md를 참고하세요.",
                        incident:
                          "게임 시나리오·사건 기록·보안 문제는 본 프로젝트가 작성한 2차 창작이며 CC BY-SA 3.0으로 배포됩니다.",
                        researcher:
                          "https://scp-wiki.wikidot.com/licensing-guide",
                      });
                    }}
                  >
                    CC BY-SA 3.0
                  </a>
                </span>
              </footer>
            </main>
          </div>
        </>
      ) : (
        <Intro
          onRegister={() => {
            setError("");
            setAuth("register");
          }}
          onLogin={async (codename, password) => {
            await api("/auth/login", { codename, password });
            const user = await refresh();
            if (!user)
              throw new Error(
                "로그인 정보를 확인하지 못했습니다. 다시 시도하세요.",
              );
            setError("");
            go("overview");
          }}
        />
      )}
      {auth && (
        <div className="modal-backdrop" onClick={() => !busy && setAuth(false)}>
          <section
            className="modal auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="닫기"
              onClick={() => setAuth(false)}
            >
              <X />
            </button>
            <Fingerprint size={42} className="auth-icon" />
            <span className="eyebrow">FOUNDATION PERSONNEL ACCESS</span>
            <h2 id="auth-title">
              {auth === "register" ? "새 요원 등록" : "요원 인증"}
            </h2>
            <p className="muted">
              승인된 요원만 조사 시스템에 접근할 수 있습니다.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                const data = new FormData(e.currentTarget);
                try {
                  await api("/auth/" + auth, {
                    codename: data.get("codename"),
                    password: data.get("password"),
                  });
                  if (!(await refresh()))
                    throw new Error(
                      "계정 정보를 확인하지 못했습니다. 다시 시도하세요.",
                    );
                  setAuth(false);
                  go("overview");
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                코드명
                <input
                  autoFocus
                  name="codename"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[a-zA-Z0-9_-]{3,24}"
                  autoComplete="username"
                  placeholder="agent-k17"
                />
              </label>
              <label>
                비밀번호
                <input
                  name="password"
                  type="password"
                  required
                  minLength={auth === "register" ? 10 : 1}
                  maxLength={72}
                  autoComplete={
                    auth === "register" ? "new-password" : "current-password"
                  }
                  placeholder="10자 이상"
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary full" disabled={busy}>
                {busy
                  ? "인증 처리 중…"
                  : auth === "register"
                    ? "요원 등록 및 접속"
                    : "보안 시스템 접속"}
                <ArrowRight size={16} />
              </button>
            </form>
            <button
              className="text-button auth-switch"
              onClick={() => {
                setAuth(auth === "register" ? "login" : "register");
                setError("");
              }}
            >
              {auth === "register"
                ? "이미 등록된 요원입니까? 로그인"
                : "등록된 코드명이 없습니까? 요원 등록"}
            </button>
            <small className="auth-foot">
              <LockKeyhole size={12} /> 비밀번호 암호화 저장 · 보안 쿠키 세션
            </small>
          </section>
        </div>
      )}
      {doc && (
        <div className="modal-backdrop document-scene-backdrop" style={{backgroundImage: `linear-gradient(#04080466,#04080488),url(${doc.id.startsWith("DOC-") ? getScene(Number(doc.id.slice(4))).image : "/images/story/facility-research.webp"})`}} onClick={() => setDoc(null)}>
          <article
            className="modal dossier"
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="문서 닫기"
              onClick={() => setDoc(null)}
            >
              <X />
            </button>
            <div className="dossier-masthead">
              <Shield size={34} strokeWidth={1.3} />
              <div><b>SCP FOUNDATION</b><small>SECURE. CONTAIN. PROTECT. / SITE-17</small></div>
            </div>
            <div className="classified-label">
              {doc.id} / LEVEL {doc.clearance}
            </div>
            <h2 id="document-title">{doc.title}</h2>
            <dl>
              <dt>개체 / Object Class</dt>
              <dd>
                {doc.scp} / {doc.objectClass}
              </dd>
              <dt>특수 격리 절차</dt>
              <dd>{doc.containment}</dd>
              <dt>설명</dt>
              <dd>{doc.description}</dd>
              <dt>사고 기록</dt>
              <dd>{doc.incident}</dd>
              <dt>관련 연구원 / 출처</dt>
              <dd>{doc.researcher}</dd>
            </dl>
            <div className="dossier-footer"><span>기밀 기록 사본 / {doc.id}</span><span>ARCHIVE CONTROL · SITE ██-17</span></div>
            {doc.id === "LICENSE" && (
              <div className="license-links">
                <a
                  href="https://scp-wiki.wikidot.com/scp-173"
                  target="_blank"
                  rel="noreferrer"
                >
                  SCP-173
                </a>
                <a
                  href="https://scp-wiki.wikidot.com/scp-049"
                  target="_blank"
                  rel="noreferrer"
                >
                  SCP-049
                </a>
                <a
                  href="https://scp-wiki.wikidot.com/scp-079"
                  target="_blank"
                  rel="noreferrer"
                >
                  SCP-079
                </a>
                <a
                  href="https://creativecommons.org/licenses/by-sa/3.0/"
                  target="_blank"
                  rel="noreferrer"
                >
                  CC BY-SA 3.0
                </a>
              </div>
            )}
          </article>
        </div>
      )}
      {showEnding && me?.ending && (
        <div className="modal-backdrop ending-backdrop">
          <section
            className="modal ending"
            role="dialog"
            aria-modal="true"
            aria-label="ACT I 엔딩"
          >
            <Shield size={48} />
            <pre>{me.ending}</pre>
            <button
              className="primary"
              onClick={() => {
                setShowEnding(false);
                go("missions");
              }}
            >
              기록 보관 <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function Stat({
  label,
  value,
  unit,
  icon,
  danger = false,
}: {
  label: string;
  value: string;
  unit: string;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={"stat " + (danger ? "danger" : "")}>
      <div className="stat-label">
        {label}
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{unit}</small>
    </div>
  );
}
function SectionTitle({
  kicker,
  title,
  right,
}: {
  kicker: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
      </div>
      {right}
    </div>
  );
}
function PageTitle({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-title">
      <span className="eyebrow">{kicker}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function ChapterCard({
  ch,
  me,
  onClick,
}: {
  ch: Chapter;
  me: Me | null;
  onClick: () => void;
}) {
  const done = ch.ids.filter((id) => me?.solved.includes(id)).length,
    locked = (me?.accessClearance || 0) < ch.requiredClearance,
    status = locked
      ? "LOCKED"
      : done === ch.ids.length
        ? "COMPLETED"
        : done
          ? "IN PROGRESS"
          : "AVAILABLE";
  return (
    <button
      className={"chapter-row " + (locked ? "locked" : "")}
      onClick={onClick}
    >
      <span className="chapter-number">0{ch.id}</span>
      <div className="chapter-info">
        <small>{ch.subtitle}</small>
        <h3>{ch.title}</h3>
        <div className="progress-track">
          <i style={{ width: `${(done / ch.ids.length) * 100}%` }} />
        </div>
      </div>
      <div className="chapter-status">
        <span className={locked ? "" : "green-text"}>
          {locked ? <LockKeyhole size={10} /> : <i />}
          {status}
        </span>
        <small>
          {done} / {ch.ids.length} 완료
        </small>
      </div>
      <ChevronRight size={17} />
    </button>
  );
}
function ChallengeView({
  c,
  me,
  refresh,
  back,
  ending,
  next,
}: {
  c: Challenge;
  me: Me;
  refresh: () => Promise<Me | null>;
  back: () => void;
  ending: () => void;
  next: (id: number) => void;
}) {
  const [flag, setFlag] = useState(""),
    [hints, setHints] = useState<string[]>([]),
    [solution, setSolution] = useState(""),
    [message, setMessage] = useState(""),
    [correct, setCorrect] = useState(false),
    [busy, setBusy] = useState(false);
  const canReview = me.user.role === "admin" || me.solved.includes(c.id);
  const solved = me.solved.includes(c.id),
    previousHint = Math.max(
      0,
      ...me.hints.filter((h) => h.challengeId === c.id).map((h) => h.level),
    );
  useEffect(() => {
    if (canReview)
      api<{ explanation: string }>(`/challenges/${c.id}/solution`)
        .then((b) => setSolution(b.explanation))
        .catch((e) => setMessage(e.message));
  }, [c.id, canReview]);
  return (
    <div className="challenge-view">
      <button className="text-button back-button" onClick={back}>
        ← 조사 임무 목록
      </button>
      <div className="page-title">
        <span className="eyebrow">
          CHAPTER 0{c.chapterId} / MISSION {num(c.id)}
        </span>
        <h1>
          {c.title}
          {solved && (
            <span className="solved-chip">
              <Check size={14} /> COMPLETED
            </span>
          )}
        </h1>
        <div className="challenge-meta">
          <span>{c.category}</span>
          <span>
            {c.difficultyLabel} · {c.difficulty}/10
          </span>
          <b>{c.points} PT</b>
        </div>
      </div>
      <div className="challenge-layout">
        <div>
          <EvidenceScene id={c.id} solved={solved} />
          <section className="panel story-panel">
            <span className="eyebrow">INCIDENT BRIEF</span>
            <h2>사건 기록</h2>
            <p>{c.description}</p>
            <div className="objective">
              <b>
                <Shield size={16} /> 임무 목표
              </b>
              <p>{c.objective}</p>
            </div>
          </section>
          <section className="panel evidence-panel">
            <SectionTitle
              kicker="ANALYSIS WORKSPACE"
              title="증거 분석"
              right={<FlaskConical size={20} />}
            />
            {c.attachment ? (
              <>
                {c.attachment.endsWith(".png") && (
                  <figure className="evidence-preview">
                    <a href={"/evidence/" + c.attachment} target="_blank" rel="noreferrer" aria-label="회수한 CCTV 원본 이미지 열기">
                      <img src={"/evidence/" + c.attachment} alt="격리실 철문과 깨진 관측창이 기록된 제17기지 CCTV 회수 프레임" />
                    </a>
                    <figcaption>RECOVERED FRAME / CAM 173-B · 원본을 열거나 다운로드하여 분석하세요.</figcaption>
                  </figure>
                )}
                <div className="evidence-file">
                  <FileText size={32} />
                  <div>
                    <b>{c.attachment.split("/").pop()}</b>
                    <small>TRAINING EVIDENCE / MISSION {num(c.id)}</small>
                  </div>
                  <a
                    className="secondary"
                    href={"/evidence/" + c.attachment}
                    download
                  >
                    <ArrowDownToLine size={16} /> 다운로드
                  </a>
                </div>
                {c.attachment.endsWith(".html") ? (
                  <>
                    <p className="muted">
                      실습 페이지를 별도 탭에서 열고 소스 코드와 개발자 도구를
                      조사하세요.
                    </p>
                    <a
                      className="secondary"
                      href={"/evidence/" + c.attachment}
                      target="_blank"
                      rel="noreferrer"
                    >
                      실습 페이지 열기 <ArrowRight size={15} />
                    </a>
                  </>
                ) : (
                  <p className="muted">
                    원본 파일을 다운로드해 분석하세요. 모든 로그는 가상
                    데이터이며, 시간대는 KST로 통일되어 있습니다.
                  </p>
                )}
              </>
            ) : (
              <div className="lab-instructions">
                <span className="lab-badge">ISOLATED DOCKER LAB</span>
                <p>
                  취약한 문서 조회 기능은 운영 서버에서 분리된 로컬 컨테이너로
                  실행합니다.
                </p>
                <ol>
                  <li>
                    <a
                      href="https://github.com/seokgw/scp-containment-breach"
                      target="_blank"
                      rel="noreferrer"
                    >
                      GitHub 저장소
                    </a>
                    를 내려받으세요.
                  </li>
                  <li>
                    Docker Desktop 실행 후 프로젝트 폴더에서 아래 명령을
                    실행하세요.
                  </li>
                </ol>
                <pre>docker compose up --build -d</pre>
                <p>
                  <a
                    href="http://127.0.0.1:8080"
                    target="_blank"
                    rel="noreferrer"
                  >
                    http://127.0.0.1:8080
                  </a>
                  에서 보고서를 조사하세요.
                </p>
                <p className="muted">
                  종료: <code>docker compose down</code>
                  <br />
                  Docker가 없는 로컬 개발 환경: <code>npm run lab</code>
                </p>
              </div>
            )}
          </section>
          {canReview && solution && (
            <section className="panel solution-panel">
              <span className="eyebrow green-text">
                DEBRIEF / ACCESS GRANTED
              </span>
              <h2>학습 해설</h2>
              <p>{solution}</p>
              <h3>해금된 사건 기록</h3>
              <p>
                {
                  me.documents.find((d) => d.id === "DOC-" + num(c.id))
                    ?.incident
                }
              </p>
              {c.id < 10 && (
                <button className="scene-next" onClick={() => next(c.id + 1)}>
                  <span>
                    <small>다음 조사 지점</small>
                    <b>{getScene(c.id + 1).room}</b>
                  </span>
                  <span>
                    다음 현장으로 <ArrowRight size={15} />
                  </span>
                </button>
              )}
            </section>
          )}
        </div>
        <aside className="challenge-side">
          <section className="panel flag-panel">
            <SectionTitle kicker="EVIDENCE VALIDATION" title="FLAG 제출" />
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const result = await api<{
                    correct: boolean;
                    message: string;
                    ending?: string;
                  }>(`/challenges/${c.id}/submit`, { flag });
                  setCorrect(result.correct);
                  setMessage(result.message);
                  if (result.correct) {
                    const updated = await refresh();
                    setFlag("");
                    if (updated?.completed) ending();
                  }
                } catch (err) {
                  setCorrect(false);
                  setMessage((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="sr-only" htmlFor="flag">
                FLAG
              </label>
              <input
                id="flag"
                placeholder="SCP{...}"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                required
                autoComplete="off"
                maxLength={205}
              />
              <button className="primary full" disabled={busy}>
                {busy ? "검증 중…" : "증거 검증"}
                <ArrowRight size={15} />
              </button>
            </form>
            {message && (
              <p
                className={correct ? "success-message" : "form-error"}
                role="status"
              >
                {message}
              </p>
            )}
            <small className="muted">
              정답 점수는 한 번만 지급됩니다.
              <br />
              분당 최대 20회 제출할 수 있습니다.
            </small>
          </section>
          <section className="panel hint-panel">
            <SectionTitle
              kicker="ANALYST ASSISTANCE"
              title="조사 힌트"
              right={<CircleHelp size={19} />}
            />
            <p className="muted">
              막혔다면 한 단계씩 확인하세요. 힌트 사용에 점수 차감은 없습니다.
            </p>
            {[1, 2, 3].map((level) => (
              <div className="hint-item" key={level}>
                <button
                  onClick={async () => {
                    try {
                      const result = await api<{ hints: string[] }>(
                        `/challenges/${c.id}/hint`,
                        { level },
                      );
                      setHints(result.hints);
                      await refresh();
                    } catch (e) {
                      setCorrect(false);
                      setMessage((e as Error).message);
                    }
                  }}
                >
                  <span>
                    0{level}{" "}
                    <b>{["방향 찾기", "도구 확인", "분석 방법"][level - 1]}</b>
                  </span>
                  {hints.length >= level ? (
                    <Check size={15} />
                  ) : (
                    <ChevronRight size={15} />
                  )}
                </button>
                {hints[level - 1] && <p>{hints[level - 1]}</p>}
              </div>
            ))}
            {previousHint > 0 && !hints.length && (
              <p className="muted">
                이전에 {previousHint}단계까지 확인했습니다. 해당 단계를 눌러
                다시 열 수 있습니다.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
