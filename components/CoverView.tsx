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
    return (
      <div className="cover fable">
        <div className="issue">{issueTitle}</div>
        <div className="mag">
          {m.magazine}
          <small>{m.magazineEn}</small>
        </div>
        <div className="vert">
          <span className="sec">巻頭</span>
          {m.kanto.map((w) => (
            <div key={w.id} className={`w kanto${w.is_new ? " new" : ""}`}>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
            </div>
          ))}
          {!m.kanto.length && <div className="w kanto"><span className="t empty">空席</span></div>}
          <span className="sec">特集</span>
          {m.tokushu.map((w) => (
            <div key={w.id} className={`w tokushu${w.is_new ? " new" : ""}`}>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
            </div>
          ))}
        </div>
        {small}
        <div className="foot2">
          <span>{state}　COVER {m.kanto.length + m.tokushu.length + m.kanmatsu.length} / {m.counts.submissions}</span>
          <span>編集: 蔵人</span>
        </div>
      </div>
    );
  }
  if (m.editor === "nina") {
    const cols = ["#4285f4", "#ea4335", "#34a853"];
    return (
      <div className="cover flash">
        <div className="mag">
          {m.magazine}
          <small>{m.magazineEn}</small>
        </div>
        <div className="issue">{issueTitle}</div>
        <div className="body">
          {m.kanto.map((w) => (
            <div key={w.id} className={`w kanto${w.is_new ? " new" : ""}`}>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
            </div>
          ))}
          {!m.kanto.length && <div className="w kanto"><span className="t">巻頭は空席</span></div>}
          {m.tokushu.map((w, i) => (
            <div key={w.id} className={`w tokushu${w.is_new ? " new" : ""}`} style={{ ["--c" as string]: cols[i % 3], ["--r" as string]: `${[-1.5, 1, -0.5][i % 3]}deg` }}>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
            </div>
          ))}
        </div>
        {small}
        <div className="foot2">
          <span>{state}　COVER {m.kanto.length + m.tokushu.length + m.kanmatsu.length} / {m.counts.submissions}</span>
          <span>編集: 二ナ</span>
        </div>
      </div>
    );
  }
  const rows = [
    ...m.kanto.map((w) => ({ w, cls: "kanto" })),
    ...m.tokushu.map((w) => ({ w, cls: "tokushu" })),
    ...m.kanmatsu.map((w) => ({ w, cls: "kanmatsu" })),
  ];
  return (
    <div className="cover astra">
      <div className="mag">
        ASTRA<small>{m.magazine}</small>
      </div>
      <div className="planets">
        <i className="sun" />
        <i className="earth" />
        <i className="moon" />
      </div>
      <div className="issue">
        {issueTitle}　{published ? "PUBLISHED" : "NOW TYPESETTING"}
      </div>
      <div className="body">
        {rows.map(({ w, cls }, i) => (
          <div key={w.id} className={`w ${cls}${w.is_new ? " new" : ""}`}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <span>
              <span className="t">{w.title}</span>
              <span className="a">{w.pen_name}</span>
            </span>
          </div>
        ))}
        {!rows.length && <div className="w kanmatsu"><span className="n">01</span><span className="t empty">まだ空いています</span></div>}
      </div>
      <div className="foot2">
        <span>{state}　COVER {rows.length} / {m.counts.submissions}</span>
        <span>編集: ソル</span>
      </div>
    </div>
  );
}
