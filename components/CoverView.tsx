import type { CoverWork, MagazineCover } from "@/lib/cover";

// 雑誌の表紙。3誌で見た目が違う。mine に入っている作品には「あなた」の印が付く。
// 表紙に置く文字は、題字、号、巻頭・特集・巻末の作品名と作者名だけ。飾りの英語や数は置かない（絵の雰囲気を壊さないため）。
export default function CoverView({ m, issueTitle, mine = [] }: { m: MagazineCover; issueTitle: string; published?: boolean; mine?: string[] }) {
  const isMine = (w: CoverWork) => mine.includes(w.id);
  // 長い作品名は文字を小さくして、途中で折れないようにする（9字以上でl2、13字以上でl3）
  const len = (w: CoverWork) => [...w.title].length;
  const cls = (w: CoverWork, kind: string) => `w ${kind}${w.is_new ? " new" : ""}${isMine(w) ? " mine" : ""}${len(w) > 12 ? " l3" : len(w) > 8 ? " l2" : ""}`;
  const you = (w: CoverWork) => (isMine(w) ? <span className="you">あなた</span> : null);
  // 巻末の帯。3誌とも同じ形（『作品名』作者名を横に並べる）で、置く場所と色だけ違う。
  const strip = (
    <div className="small">
      <b>巻末</b>
      {m.kanmatsu.length ? (
        m.kanmatsu.map((w) => (
          <span key={w.id} className={`km${isMine(w) ? " mine" : ""}`}>
            『{w.title}』{w.pen_name}
            {you(w)}
          </span>
        ))
      ) : (
        <span className="empty">まだ空いています</span>
      )}
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
            <div key={w.id} className={cls(w, "kanto")}>
              <span className="sec">〈巻頭〉</span>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
              {you(w)}
            </div>
          ))}
          {!m.kanto.length && <div className="w kanto"><span className="sec">〈巻頭〉</span><span className="t empty">空席</span></div>}
          {m.tokushu.map((w, i) => (
            <div key={w.id} className={cls(w, "tokushu")}>
              {i === 0 && <span className="sec">〈特集〉</span>}
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
              {you(w)}
            </div>
          ))}
          {!m.tokushu.length && <div className="w tokushu"><span className="sec">〈特集〉</span><span className="t empty">まだ空いています</span></div>}
        </div>
        {strip}
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
            <div key={w.id} className={cls(w, "kanto")}>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
              {you(w)}
            </div>
          ))}
          {!m.kanto.length && <div className="w kanto"><span className="t empty">空席</span></div>}
        </div>
        <div className="colR">
          <span className="sec">特集</span>
          {m.tokushu.map((w) => (
            <div key={w.id} className={cls(w, "tokushu")}>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
              {you(w)}
            </div>
          ))}
          {!m.tokushu.length && <div className="w tokushu"><span className="t empty">まだ空いています</span></div>}
        </div>
        {strip}
      </div>
    );
  }
  const labelColors = ["#ffd86b", "#7fe7ff", "#c9a6ff"];
  return (
    <div className="cover astra">
      <img className="ly" src="/covers/sol/bg.webp" alt="" />
      <div className="mag">
        {[...m.magazine].map((ch, i) => (
          <span key={i} style={{ color: ["#ffffff", "#ffffff", "#ffd86b", "#7fe7ff", "#c9a6ff", "#9fe6b8", "#ffd86b"][i % 7] }}>
            {ch}
          </span>
        ))}
      </div>
      <div className="issue">
        <span>{issueTitle}</span>
      </div>
      <div className="lead">
        {m.kanto.map((w) => (
          <div key={w.id} className={cls(w, "kanto")}>
            <span className="t">{w.title}</span>
            <span className="a">{w.pen_name}</span>
            {you(w)}
          </div>
        ))}
        {!m.kanto.length && <div className="w kanto"><span className="t empty">巻頭は空席</span></div>}
        <div className="rule" />
        {m.tokushu.map((w, i) => (
          <div key={w.id} className={cls(w, "tokushu")}>
            <span className="lab" style={{ color: labelColors[i % 3] }}>特集</span>
            <span className="t">
              {w.title}
              {you(w)}
            </span>
            <span className="a">{w.pen_name}</span>
          </div>
        ))}
        {!m.tokushu.length && <div className="w tokushu"><span className="lab" style={{ color: labelColors[0] }}>特集</span><span className="t empty">まだ空いています</span></div>}
      </div>
      {strip}
    </div>
  );
}
