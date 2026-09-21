import type { MagazineCover } from "@/lib/cover";

// 雑誌の表紙。3誌で見た目が違う。
export default function CoverView({ m, issueTitle, published }: { m: MagazineCover; issueTitle: string; published: boolean }) {
  const state = published ? "発行" : "組版中";
  const small = (
    <div className="small">
      <b>巻末</b>
      {m.kanmatsu.length ? m.kanmatsu.map((w) => `『${w.title}』${w.pen_name}`).join("　") : <span className="empty">まだ空いています</span>}
    </div>
  );
  if (m.editor === "kurodo") {
    // 生成りの紙に、上に大きな題字、下の段に縦書きの名前。
    return (
      <div className="cover fable">
        <img className="ly" src="/covers/kurodo/bg.webp" alt="" />
        <div className="issue">{issueTitle}</div>
        <div className="mag">{m.magazine}</div>
        <div className="list">
          {m.kanto.map((w) => (
            <div key={w.id} className={`w kanto${w.is_new ? " new" : ""}`}>
              <span className="sec">〈巻頭〉</span>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
            </div>
          ))}
          {!m.kanto.length && <div className="w kanto"><span className="sec">〈巻頭〉</span><span className="t empty">空席</span></div>}
          {m.tokushu.map((w, i) => (
            <div key={w.id} className={`w tokushu${w.is_new ? " new" : ""}`}>
              {i === 0 && <span className="sec">〈特集〉</span>}
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
            </div>
          ))}
          {m.kanmatsu.map((w, i) => (
            <div key={w.id} className={`w kanmatsu${w.is_new ? " new" : ""}`}>
              {i === 0 && <span className="sec">〈巻末〉</span>}
              <span className="t">{w.pen_name}</span>
            </div>
          ))}
        </div>
        <div className="foot2">
          <span>{state}　{m.kanto.length + m.tokushu.length + m.kanmatsu.length} / {m.counts.submissions}</span>
          <span>AI EDITORIAL DEPT.</span>
        </div>
      </div>
    );
  }
  if (m.editor === "nina") {
    // 3枚の絵（地、ロゴ、マスコット）を重ねて、その上に作品名を置く。
    return (
      <div className="cover gemini">
        <img className="ly" src="/covers/nina/bg.webp" alt="" />
        <img className="ly" src="/covers/nina/mascot.webp" alt="" />
        <img className="ly" src="/covers/nina/logo.webp" alt={m.magazine} />
        <div className="issue">{issueTitle}</div>
        <div className="colL">
          <span className="sec">巻頭</span>
          {m.kanto.map((w) => (
            <div key={w.id} className={`w kanto${w.is_new ? " new" : ""}`}>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
            </div>
          ))}
          {!m.kanto.length && <div className="w kanto"><span className="t empty">空席</span></div>}
        </div>
        <div className="colR">
          <span className="sec">特集</span>
          {m.tokushu.map((w) => (
            <div key={w.id} className={`w tokushu${w.is_new ? " new" : ""}`}>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
            </div>
          ))}
          {!m.tokushu.length && <div className="w tokushu"><span className="t empty">まだ空いています</span></div>}
        </div>
        {small}
        <div className="foot2">
          <span>{state}　COVER {m.kanto.length + m.tokushu.length + m.kanmatsu.length} / {m.counts.submissions}</span>
          <span>編集: 二ナ</span>
        </div>
      </div>
    );
  }
  const labelColors = ["#ffd86b", "#7fe7ff", "#c9a6ff"];
  return (
    <div className="cover astra">
      <img className="ly" src="/covers/sol/bg.webp" alt="" />
      <div className="tagline">AIが編集する、読者のための小説雑誌</div>
      <div className="mag">
        {[...m.magazine].map((ch, i) => (
          <span key={i} style={{ color: ["#ffffff", "#ffffff", "#ffd86b", "#7fe7ff", "#c9a6ff", "#9fe6b8", "#ffd86b"][i % 7] }}>
            {ch}
          </span>
        ))}
      </div>
      <div className="credit">編集AI　ASTRA / SOL / TERRA / LUNA</div>
      <div className="issue">
        <span>{issueTitle}</span>
        <span className="vol">{published ? "PUBLISHED" : "NOW TYPESETTING"}</span>
      </div>
      <div className="pl sol">SOL</div>
      <div className="pl luna">LUNA</div>
      <div className="pl terra">TERRA</div>
      <div className="lead">
        {m.kanto.map((w) => (
          <div key={w.id} className={`w kanto${w.is_new ? " new" : ""}`}>
            <span className="t">{w.title}</span>
            <span className="a">{w.pen_name}</span>
          </div>
        ))}
        {!m.kanto.length && <div className="w kanto"><span className="t empty">巻頭は空席</span></div>}
        <div className="rule" />
        {m.tokushu.map((w, i) => (
          <div key={w.id} className={`w tokushu${w.is_new ? " new" : ""}`}>
            <span className="lab" style={{ color: labelColors[i % 3] }}>特集</span>
            <span className="t">{w.title}</span>
            <span className="a">{w.pen_name}</span>
          </div>
        ))}
        {!m.tokushu.length && <div className="w tokushu"><span className="lab" style={{ color: labelColors[0] }}>特集</span><span className="t empty">まだ空いています</span></div>}
      </div>
      <div className="writers">
        <div className="lab">巻末の執筆陣</div>
        <div className="names">{m.kanmatsu.length ? m.kanmatsu.map((w) => `${w.pen_name}`).join(" ／ ") : <span className="empty">まだ空いています</span>}</div>
      </div>
      <div className="foot2">
        <span>{state}　{m.kanto.length + m.tokushu.length + m.kanmatsu.length} / {m.counts.submissions}</span>
        <span>STORIES ORBIT FURTHER</span>
      </div>
    </div>
  );
}
