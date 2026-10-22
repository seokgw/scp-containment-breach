import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileSearch,
  Focus,
  LockKeyhole,
  MapPin,
  Radio,
  X,
} from "lucide-react";
import { chapterZones, getScene, scenes, zones, type ZoneId } from "./story";
import "./investigation.css";

export function FacilityRoute({
  solved,
  clearance,
  onChapter,
}: {
  solved: number[];
  clearance: number;
  onChapter: (chapter: number) => void;
}) {
  return (
    <section className="facility-route" aria-label="기지 조사 동선">
      <div className="facility-route-head">
        <span>
          <Radio size={13} /> SITE ██-17 / INVESTIGATION ROUTE
        </span>
        <small>증거를 따라 다음 구역으로</small>
      </div>
      <div className="facility-route-nodes">
        {Object.values(zones).map((zone, index) => {
          const missions = scenes.filter((s) => s.zone === zone.id),
            count = missions.filter((s) => solved.includes(s.id)).length,
            locked = clearance < index;
          return (
            <div className="facility-node-wrap" key={zone.id}>
              <button
                className={
                  "facility-node " +
                  (locked
                    ? "route-locked"
                    : count === missions.length
                      ? "route-complete"
                      : "route-active")
                }
                onClick={() => onChapter(zone.chapter)}
                aria-label={`${zone.label}${locked ? " 잠김" : ""}`}
              >
                <span className="facility-node-number">0{zone.chapter}</span>
                <div>
                  <small>{zone.code}</small>
                  <h3>{zone.label}</h3>
                  <span>
                    {locked ? (
                      <>
                        <LockKeyhole size={10} /> 미승인 구역
                      </>
                    ) : count === missions.length ? (
                      <>
                        <Check size={10} /> 조사 완료
                      </>
                    ) : (
                      <>
                        <MapPin size={10} /> 조사 가능
                      </>
                    )}
                    <b>
                      {count} / {missions.length}
                    </b>
                  </span>
                </div>
              </button>
              {index < 2 && <ChevronRight className="route-arrow" size={17} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SectorBanner({
  chapter,
  solved,
}: {
  chapter: number;
  solved: number[];
}) {
  const zone = zones[chapterZones[chapter]],
    missions = scenes.filter((s) => s.zone === zone.id);
  return (
    <div
      className={"sector-banner sector-" + zone.id}
      style={{
        backgroundImage: `linear-gradient(90deg,rgba(8,14,19,.95),rgba(8,14,19,.35)),url(${zone.image})`,
      }}
    >
      <span className="sector-banner-code">{zone.code}</span>
      <h3>{zone.label}</h3>
      <p>
        {chapter === 1
          ? "멈춘 단말과 파쇄된 기록 사이에서 첫 흔적을 찾으십시오."
          : chapter === 2
            ? "꺼진 감시 장치와 문서 보관실을 연결해 수동 개입을 추적하십시오."
            : "연구 일지와 마지막 통신을 연결해 검열된 기록을 복원하십시오."}
      </p>
      <span className="sector-banner-count">
        {missions.filter((s) => solved.includes(s.id)).length} /{" "}
        {missions.length} 현장 조사 완료
      </span>
    </div>
  );
}

export function SceneThumb({ id }: { id: number }) {
  const scene = getScene(id);
  return (
    <div className="scene-thumb">
      <img src={scene.image} alt="" loading="lazy" decoding="async" />
      <span>
        <MapPin size={10} />
        {scene.room}
      </span>
      <i>현장 증거</i>
    </div>
  );
}

export function EvidenceScene({ id, solved }: { id: number; solved: boolean }) {
  const scene = getScene(id),
    zone = zones[scene.zone];
  const [inspected, setInspected] = useState(false),
    [expanded, setExpanded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null),
    triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", key);
      triggerRef.current?.focus();
    };
  }, [expanded]);
  return (
    <section
      className={"panel field-evidence field-" + scene.zone}
      aria-labelledby={"field-title-" + id}
    >
      <div className="field-header">
        <div>
          <span>FIELD RECORD / E-{String(id).padStart(3, "0")}</span>
          <h2 id={"field-title-" + id}>{scene.item}</h2>
        </div>
        <span className={"field-state " + (solved ? "field-verified" : "")}>
          <i />
          {solved ? "증거 검증 완료" : "현장 기록 발견"}
        </span>
      </div>
      <div className="field-photo">
        <img src={scene.image} alt={scene.alt} decoding="async" />
        <div className="field-photo-vignette" />
        <span className="field-room">
          <MapPin size={11} />
          {scene.room}
        </span>
        <button
          className={"evidence-hotspot " + (inspected ? "inspected" : "")}
          onClick={() => setInspected((v) => !v)}
          aria-expanded={inspected}
          aria-controls={"fragment-" + id}
          aria-label={`${scene.item} 조사`}
        >
          <span>
            {inspected ? <Check size={14} /> : <FileSearch size={14} />}
          </span>
          <b>
            {inspected ? "기록 확인 중" : "발견한 기록 조사"}
            <ArrowRight size={11} />
          </b>
        </button>
        <button
          ref={triggerRef}
          className="field-enlarge"
          onClick={() => setExpanded(true)}
          aria-label="현장 이미지 확대"
        >
          <Focus size={15} />
          <span>확대</span>
        </button>
        <div className="field-photo-caption">
          <span>RECOVERY LOCATION</span>
          <strong>{zone.label}</strong>
        </div>
      </div>
      <div className="field-narrative">
        <p>{scene.narrative}</p>
        <div>
          <span>
            <i /> 훼손 상태: {scene.damage}
          </span>
          <span>
            {inspected ? "판독 메모 열림" : "사진의 조사 지점을 눌러 기록 확인"}
          </span>
        </div>
      </div>
      {inspected && (
        <div className="fragment-wrap" id={"fragment-" + id}>
          <article className="fragment-paper">
            <div className="fragment-paper-top">
              <span>FOUNDATION / INCIDENT RECORD</span>
              <b>E-{String(id).padStart(3, "0")}</b>
            </div>
            <div className="fragment-stamp">DAMAGED COPY</div>
            <h3>{scene.item}</h3>
            <div className="fragment-meta">
              <span>발견 위치: {scene.room}</span>
              <span>복원 상태: 부분 판독</span>
            </div>
            <p>
              <span
                className="ink-redaction"
                aria-label="훼손으로 판독할 수 없음"
              >
                [판독 불가]
              </span>{" "}
              / {scene.fragment}
            </p>
            <div className="fragment-missing" aria-label="문서 일부 소실">
              해당 부분 소실
            </div>
            <p className="fragment-annotation">분석관 메모 — {scene.lead}</p>
            <div className="fragment-paper-bottom">
              <span>기록의 진위는 원본 증거로 검증할 것.</span>
              <span>복구 사본</span>
            </div>
          </article>
          <p className="field-note">
            현장 이미지는 이야기 연출입니다. 실제 분석은 아래 원본 실습 자료로
            진행하세요.
          </p>
        </div>
      )}
      {expanded &&
        createPortal(
          <div
            className="evidence-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby={"image-title-" + id}
            onClick={() => setExpanded(false)}
          >
            <div
              className="evidence-lightbox-inner"
              onClick={(e) => e.stopPropagation()}
            >
              <header>
                <div>
                  <span>{scene.room}</span>
                  <h2 id={"image-title-" + id}>{scene.item}</h2>
                </div>
                <button
                  ref={closeRef}
                  onClick={() => setExpanded(false)}
                  aria-label="확대 이미지 닫기"
                >
                  <X size={20} />
                </button>
              </header>
              <img src={scene.image} alt={scene.alt} />
              <p>
                {scene.damage} · {scene.narrative}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
