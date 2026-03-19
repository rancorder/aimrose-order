import { useState, useEffect, useRef, useCallback } from 'react'

// ─── ROUTING ───────────────────────────────────────────────────────────────
function getRoute() {
  return window.location.pathname === '/presenter' ? 'presenter' : 'customer'
}

// ─── BROADCAST CHANNEL ─────────────────────────────────────────────────────
const CHANNEL = 'aimrose-slide-sync'

function useSyncSend() {
  const ch = useRef(null)
  const ready = useRef(false)
  useEffect(() => {
    ch.current = new BroadcastChannel(CHANNEL)
    ready.current = true
    return () => { ch.current.close(); ready.current = false }
  }, [])
  const send = useRef((sectionId) => {
    if (ready.current) ch.current.postMessage({ sectionId })
    else setTimeout(() => ch.current?.postMessage({ sectionId }), 150)
  })
  return send.current
}

function useSyncReceive(onSection) {
  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL)
    ch.onmessage = (e) => { if (e.data?.sectionId) onSection(e.data.sectionId) }
    return () => ch.close()
  }, [onSection])
}

// ─── CUSTOMER → PRESENTER SECTION MAP ──────────────────────────────────────
const CUSTOMER_MAP = {
  intro: 'intro',
  background: 'background',
  strength: 'strength',
  service: 'service',
  method1: 'method1',
  method2: 'method2',
  pricing: 'pricing',
  wholesale: 'wholesale',
  steps: 'steps',
  contact: 'contact',
}

// ─── PRESENTER SECTIONS ────────────────────────────────────────────────────
const BANT_ITEMS = [
  { id: 'budget', label: '予算：外注にかけられる予算感はどれくらいか？' },
  { id: 'authority', label: '決裁者：最終判断は誰が担当されるか？' },
  { id: 'needs', label: 'ニーズ：特に興味を持ったポイントはどこか？' },
  { id: 'timeline', label: 'タイムライン：いつ頃から導入をお考えか？' },
]

const OBJECTIONS = [
  {
    trigger: '検討したい',
    response: 'ありがとうございます。仕様・納期の詳細は技術者との打ち合わせでないと正確にお伝えできない部分が多いです。30分ほどのお時間で御社の案件に当てはめた具体的な進め方をご提示できますので、次回のお時間だけいただければと思います。'
  },
  {
    trigger: '見送りたい',
    response: '率直にお話しいただきありがとうございます。外注先としてどこまでお役に立てるかは詳細を確認してみないと判断が難しい部分があります。情報整理の場として、次回30分ほどお時間をいただければ、御社にとってメリットがあるかどうかを一緒に確認できればと思います。'
  },
  {
    trigger: '会社の確認が必要',
    response: '承知いたしました。慎重に進められるのは良いことだと思います。判断材料を揃える意味でも、仕様や納期の詳細は二次商談で具体的にお伝えできます。次回は御社の体制に合わせた具体例をご用意いたしますので、30分ほどお時間をいただければと思います。'
  },
]

const P_SECTIONS = [
  {
    id: 'intro',
    label: 'イントロ',
    customerSection: 'intro',
    script: `本日はお時間をいただきありがとうございます。
株式会社aim roseの〇〇と申します。

本日は、御社で対応が難しいフルオーダー案件や特殊案件を、弊社が外注先としてお手伝いできる可能性についてお話しできればと思っております。

御社の既存のお客様により良いご提案ができるようになる点や、機会損失を防ぐ点など、メリットを感じていただける内容になっているかと思いますので、ぜひ気軽にお聞きいただければ幸いです。

どうぞよろしくお願いいたします。`,
  },
  {
    id: 'icebreak',
    label: 'アイスブレイク',
    customerSection: null,
    script: `●●様、最初に1点お伺いしてもよろしいでしょうか？
先日は突然のお電話にも関わらず、ご興味をいただけた理由を先にお伺いしてもよろしいでしょうか？

（相手の回答を受ける）

ありがとうございます。そういった背景からご興味をお持ちいただいたんですね。

もしよろしければ、現在どのような案件でお困りの場面が多いのか、少しお聞かせいただけますでしょうか。
例えば、特殊体型のお客様の対応が難しいケースや、素材の制約でお断りされているケースなど、どのあたりが課題になりやすいでしょうか。

なるほど、ありがとうございます。
お話を伺っていると、弊社がお役に立てる場面が多そうだと感じました。`,
  },
  {
    id: 'background',
    label: '提携の背景',
    customerSection: 'background',
    script: `三方よしの考え方でご説明いたします。

【御社のメリット】
フルオーダー対応で受注機会が広がり、より多くのお客様のニーズに応えられるようになります。機会損失が減ります。

【お客様のメリット】
満足度がアップします。より幅広い選択肢と高品質な製品を提供することで、お客様の期待に応えます。

【弊社のメリット】
長年培ってきた技術と経験を最大限に活用できます。

この三者にとってプラスになる関係が、今回のご提案の核心です。`,
  },
  {
    id: 'strength',
    label: '弊社の強み',
    customerSection: 'strength',
    script: `弊社には3つの大きな強みがございます。

①職人の技術
ジバンシー、コムデギャルソンなどのハイブランドを担う縫製工場で修得した技術を持っています。20年以上の実績で多ジャンル、フルアイテムの製作をしてきました。

②総合的な製作能力
デザイン、パターン、企画、縫製全てを経験し、フルオーダー製作を進めるノウハウを持っています。

③過去の実績
小澤征爾指揮による演劇舞台の衣装製作、森英恵デザイナーのサンプル製作、東京・関西コレクション衣装製作、宝塚歌劇団番組での製作指導など幅広い分野での実績があります。`,
  },
  {
    id: 'usp',
    label: 'USPサマリー',
    customerSection: null,
    script: `御社にメリットがあるポイントを3つにまとめます。

【1. 対応範囲の広さ】
特殊体型・特殊素材・特殊仕様の案件でも、職人の技術を活かして柔軟に対応できます。

【2. 制作キャパシティの柔軟さ】
一点物からまとまった数量まで、必要に応じて連携先とも協力しながら対応できるため、急な案件でもご相談いただけます。

【3. 御社のブランド価値を損なわない品質】
著名な経営者層のスーツ制作実績もあり、細部まで丁寧に仕上げる技術力を評価いただいております。`,
  },
  {
    id: 'service',
    label: 'サービス内容',
    customerSection: 'service',
    script: `外注としてご依頼いただく場合は、まず案件内容をヒアリングし、仕様・素材・納期などを確認したうえで制作に入ります。

一点物のフルオーダーから、ユニフォームのような複数着の制作まで幅広く対応可能です。

提携方法は2種類ございます：
① 非対面式受注（フリーサイズサンプルによる）
② 対面式受注（フルオーダー出張対応）

次のスライドで詳しくご説明いたします。`,
  },
  {
    id: 'method1',
    label: '提携方法①',
    customerSection: 'method1',
    script: `【提携方法1：非対面式受注】
フリーサイズ（S〜L対応）のデザインサンプルを店内またはHP上に展示。
お客様の体型に合わせて丈だけの簡単な調整で受注できます。

フロー：
サンプル展示 → 受注（丈調整） → 資材発注 → 弊社で製作 → 納品

納期：材料が揃ってから1ヶ月半〜2ヶ月

料金例（税別）：
・コート：サンプル特別価格 ¥50,000 / 通常 ¥100,000
・スーツ：サンプル特別価格 ¥50,000 / 通常 ¥100,000
・ジャケット：サンプル特別価格 ¥35,000 / 通常 ¥70,000

販売価格は御社で自由に設定いただけます。`,
  },
  {
    id: 'method2',
    label: '提携方法②',
    customerSection: 'method2',
    script: `【提携方法2：フルオーダー対面式受注】
お客様からフルオーダーの依頼を受けたら、弊社に出張依頼いただきます。

フロー：
お客様からの依頼 → 弊社に出張依頼・日程決定 → オーダー当日（御社に訪問・共同受注） → 仮縫い1〜2回 → 弊社で製作 → 納品

納期：2〜3ヶ月（仮縫いのタイミングにより前後）

出張費（受注日・仮縫い日の計2〜3回分含む）：
・近距離（20km以内）：¥10,000 + 交通費
・中距離（20〜50km）：¥20,000 + 交通費
・長距離（50km以上）：¥40,000 + 交通費`,
  },
  {
    id: 'pricing',
    label: '料金表',
    customerSection: 'pricing',
    script: `【フルオーダー料金表（税別）】

アイテム別 パターン価格 / 製作価格：
・コート：¥55,000〜 / ¥90,000〜
・ジャケット・ブルゾン：¥50,000〜 / ¥70,000〜
・ワンピース：¥45,000〜 / ¥60,000〜
・パンツ・スカート：¥35,000〜 / ¥30,000〜
・シャツ：¥35,000〜 / ¥35,000〜

オプション：
・革の場合：別途 ¥20,000
・柄合わせ：別途 ¥10,000

重要ポイント：
同じパターンを利用する場合、2着目以降はパターン代不要です。
ご紹介いただいたお客様が弊社でリピートされる場合、以後のオーダーの度に御社に20%キャッシュバックいたします。`,
  },
  {
    id: 'wholesale',
    label: '卸販売',
    customerSection: 'wholesale',
    script: `【卸販売もご提供しています】

ポケットチーフ、ミニネクタイ、ミニ蝶ネクタイなどのアクセサリーを卸値半額でご提供しています。

ポケットチーフ：
・1柄タイプ 定価2,900円 → 卸値 1,450円
・2柄タイプ 定価3,500円 → 卸値 1,750円

ミニネクタイ・ミニ蝶ネクタイ：
・定価3,900円 → 卸値 1,950円

最低発注価格 ¥10,000〜、送料別途
生地持ち込みチーフ加工賃：1枚 ¥3,000 / 10枚〜 ¥1,000/枚

ECサイト：https://aimrose.official.ec/`,
  },
  {
    id: 'hearing',
    label: 'ヒアリング',
    customerSection: null,
    bant: true,
    script: `すいません、ここまで一方的にお話ししてしまいました。
ここからは御社の現状や、今日お聞きいただいた内容の中で「ここが気になる」「少し深掘りしたい」と感じられた部分を伺えればと思っています。

【先方の取り組み・課題について】
・特殊体型のお客様をお断りする場面はどれくらいあるか
・仕様の制約で対応が難しいケースはあるか
・外注先を探されたことがあるか、その際の不安や課題
・今後強化したいサービス領域や伸ばしたい方向性

【BANT確認 ↓ チェックリストを活用してください】`,
  },
  {
    id: 'qa',
    label: 'Q&A想定',
    customerSection: null,
    script: `【想定される質疑と応答】

Q1: どこまでの仕様に対応できますか？
→ 幅広く対応可能。特殊体型・素材も含め柔軟に。詳細は技術者との打ち合わせで確認。

Q2: 納期はどれくらい見ておけばよいですか？
→ 案件内容によって変動。事前に無理のないスケジュールをご相談。詳細は二次商談で。

Q3: 一点物でも依頼できますか？
→ はい、問題ありません。むしろ一点物のフルオーダーは得意です。

Q4: 複数着も可能ですか？
→ 可能。ロットが少ない場合は単価が上がることがありますが事前にご相談。

Q5: 品質面が心配です。
→ 著名な経営者層のスーツ制作実績あり。細部まで丁寧な技術力を評価いただいています。

Q6: 料金体系は？
→ 案件内容によって変動。詳細は二次商談で仕様確認後にご提示。

Q7: 急ぎの案件でも対応できますか？
→ 内容によりますが可能な範囲で調整。納期は案件ごとに確認。`,
  },
  {
    id: 'closing',
    label: 'クロージング',
    customerSection: 'steps',
    script: `ありがとうございます。
もしよろしければ、まずは御社の体制やご希望を伺いながら、最適なプランを具体化させていただければと思っています。

「〇月〇日（〇曜日）」か「〇月〇日（〇曜日）」にお時間いただくことは可能でしょうか？
ご都合のよろしい方をお聞かせいただけると助かります。

【日程調整トーク】
お時間は午前と午後はどちらがご都合よろしいでしょうか。
●時と●時ではどちらがよろしいでしょうか。
では、●月●日の●時でお時間を頂戴できればと思います。

本日、私の方からのご案内は以上となりますが、何かご不明点はございますか？`,
    objections: true,
  },
  {
    id: 'contact',
    label: 'お問い合わせ',
    customerSection: 'contact',
    script: `本日はありがとうございました。

【お問い合わせ先】
株式会社 aim-rose（エイムローズ）
〒542-0081 大阪市中央区南船場2-2-28
ジェイ・プライド順慶ビル205

TEL: 06-6261-7373
FAX: 06-6261-7372
HP: https://aim-rose-order.com/

提携店様専用公式ラインもございます。
次回の打ち合わせ日程につきましては、改めてご連絡させていただきます。`,
  },
]

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
const C = {
  ivory: '#f5f0e8',
  cream: '#ede7d9',
  warmWhite: '#faf7f2',
  charcoal: '#1a1612',
  darkBrown: '#2c2318',
  gold: '#b8924a',
  goldLight: '#d4aa6a',
  goldDark: '#8a6830',
  rose: '#c4857a',
  slate: '#4a4540',
  muted: '#7a7068',
  // dark (presenter)
  bg: '#0d0c0a',
  surface: '#181614',
  border: '#2a2520',
  textDim: '#6a6058',
  textMid: '#a09080',
  textLight: '#e8ddd0',
}

// ─── CUSTOMER VIEW ─────────────────────────────────────────────────────────
function CustomerView() {
  const [scrollPct, setScrollPct] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sectionRefs = useRef({})

  const sections = [
    'intro', 'background', 'strength', 'service',
    'method1', 'method2', 'pricing', 'wholesale', 'steps', 'contact'
  ]

  const sectionLabels = {
    intro: '提携のご提案', background: '提携の背景', strength: '弊社の強み',
    service: 'サービス内容', method1: '提携方法①', method2: '提携方法②',
    pricing: '料金表', wholesale: '卸販売', steps: '提携開始', contact: 'お問い合わせ'
  }

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight)
      setScrollPct(Math.min(1, Math.max(0, pct)))
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // IntersectionObserver fade-in
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1'
          e.target.style.transform = 'translateY(0)'
        }
      })
    }, { threshold: 0.1 })
    document.querySelectorAll('.fade-section').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const handleSync = useCallback((sectionId) => {
    const el = sectionRefs.current[sectionId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
  useSyncReceive(handleSync)

  const scrollTo = (id) => {
    const el = sectionRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setSidebarOpen(false)
  }

  return (
    <div style={{ background: C.warmWhite, color: C.charcoal, fontFamily: "'Noto Sans JP', sans-serif", minHeight: '100vh' }}>

      {/* Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 1000, background: '#e8e0d4' }}>
        <div style={{
          height: '100%', width: `${scrollPct * 100}%`,
          background: `linear-gradient(90deg, ${C.goldDark}, ${C.goldLight})`,
          transition: 'width 0.1s linear'
        }} />
      </div>

      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 900,
        width: sidebarOpen ? 220 : 48, transition: 'width 0.3s ease',
        background: sidebarOpen ? 'rgba(26,22,18,0.97)' : 'transparent',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          width: 48, height: 48, background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          color: sidebarOpen ? C.goldLight : C.gold,
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {sidebarOpen
              ? <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              : <><rect y="4" width="20" height="1.5" rx="1"/><rect y="9.25" width="20" height="1.5" rx="1"/><rect y="14.5" width="20" height="1.5" rx="1"/></>
            }
          </svg>
        </button>
        {sidebarOpen && (
          <nav style={{ padding: '16px 0', overflowY: 'auto' }}>
            {sections.map(id => (
              <button key={id} onClick={() => scrollTo(id)} style={{
                display: 'block', width: '100%', padding: '10px 24px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.goldLight, fontFamily: "'Noto Sans JP'", fontSize: 12,
                textAlign: 'left', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = C.goldLight}
              >
                {sectionLabels[id]}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* ── HERO ─────────────────────────────────────── */}
      <section id="intro" ref={el => sectionRefs.current['intro'] = el}
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', position: 'relative',
          overflow: 'hidden', padding: '80px 60px 60px',
          background: C.charcoal,
        }}>
        {/* Decorative lines */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: 1, height: '80%', background: `linear-gradient(180deg, transparent, ${C.gold}40, transparent)` }} />
          <div style={{ position: 'absolute', top: '10%', right: '5%', width: 1, height: '80%', background: `linear-gradient(180deg, transparent, ${C.gold}40, transparent)` }} />
          <div style={{ position: 'absolute', top: '15%', left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}30, transparent)` }} />
          <div style={{ position: 'absolute', bottom: '15%', left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}30, transparent)` }} />
          {/* Large background text */}
          <div style={{
            position: 'absolute', bottom: '-2%', left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Cormorant Garamond'", fontSize: 'clamp(100px, 20vw, 280px)',
            color: 'rgba(184,146,74,0.05)', fontWeight: 300, letterSpacing: '-0.02em',
            whiteSpace: 'nowrap', userSelect: 'none',
          }}>ATELIER</div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 720 }}>
          <div style={{
            fontFamily: "'Cormorant Garamond'", fontSize: 'clamp(11px, 1.5vw, 14px)',
            color: C.gold, letterSpacing: '0.35em', textTransform: 'uppercase',
            marginBottom: 32,
          }}>
            Partnership Proposal
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond'", fontWeight: 300,
            fontSize: 'clamp(42px, 7vw, 88px)', lineHeight: 1.1,
            color: C.ivory, marginBottom: 20, letterSpacing: '-0.01em',
          }}>
            提携のご提案
          </h1>
          <div style={{
            width: 60, height: 1, background: C.gold, margin: '0 auto 32px',
          }} />
          <p style={{
            fontFamily: "'Noto Serif JP'", fontSize: 'clamp(14px, 1.8vw, 17px)',
            color: '#c8bfb0', lineHeight: 1.9, fontWeight: 300, marginBottom: 48,
          }}>
            オーダースーツ店様向けの協業案
          </p>
          <div style={{
            display: 'inline-block', padding: '14px 40px',
            border: `1px solid ${C.gold}60`, color: C.goldLight,
            fontFamily: "'Noto Sans JP'", fontSize: 12, letterSpacing: '0.2em',
          }}>
            株式会社 aim-rose（エイムローズ）
          </div>
        </div>
      </section>

      {/* ── BACKGROUND ─────────────────────────────── */}
      <section id="background" ref={el => sectionRefs.current['background'] = el}
        className="fade-section"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          padding: '100px 80px', background: C.warmWhite,
          opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <SectionLabel en="Background" ja="提携の背景" light />
          <h2 style={headingStyle(C.charcoal)}>三方よし</h2>
          <div style={{ width: 40, height: 2, background: C.gold, marginBottom: 64 }} />

          {/* Triangle visual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            {[
              { party: '御社のメリット', desc: 'フルオーダー対応で受注機会が広がり、より多くのお客様のニーズに応えられるようになります。機会損失が減ります。', icon: '🏪' },
              { party: 'お客様のメリット', desc: '満足度がアップします。より幅広い選択肢と高品質な製品を提供することで、お客様の期待に応えます。', icon: '👤' },
              { party: '弊社のメリット', desc: '長年培ってきた技術と経験を最大限に活用できます。強みを活かした事業展開が可能になります。', icon: '🌹' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '40px 32px', background: C.cream,
                borderTop: `3px solid ${C.gold}`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${C.gold}20` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontFamily: "'Noto Serif JP'", fontSize: 17, fontWeight: 500, color: C.charcoal, marginBottom: 16, letterSpacing: '0.05em' }}>{item.party}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: C.slate }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STRENGTH ───────────────────────────────── */}
      <section id="strength" ref={el => sectionRefs.current['strength'] = el}
        className="fade-section"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          padding: '100px 80px', background: C.charcoal,
          opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <SectionLabel en="Our Strengths" ja="エイムローズの強み" />
          <h2 style={headingStyle(C.ivory)}>職人の技術と20年の実績</h2>
          <div style={{ width: 40, height: 2, background: C.gold, marginBottom: 64 }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            {[
              {
                num: '01', title: '職人の技術',
                body: 'ジバンシー、コムデギャルソンなどのハイブランドを担う縫製工場で修得した技術。20年以上の実績で多ジャンル、フルアイテムの製作をしてきました。',
              },
              {
                num: '02', title: '総合的な製作能力',
                body: 'デザイン、パターン、企画、縫製全てを経験し、フルオーダー製作を進めるノウハウを持っています。',
              },
              {
                num: '03', title: '過去の実績',
                body: '小澤征爾指揮による演劇衣装製作・森英恵デザイナーのサンプル製作・東京／関西コレクション衣装・宝塚歌劇団番組での製作指導など幅広い分野での実績。',
              },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '48px 36px', background: i === 1 ? '#22201a' : '#181614',
                borderBottom: `1px solid ${C.gold}30`,
              }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond'", fontSize: 64, fontWeight: 300,
                  color: `${C.gold}25`, lineHeight: 1, marginBottom: 24,
                }}>
                  {item.num}
                </div>
                <h3 style={{
                  fontFamily: "'Noto Serif JP'", fontSize: 18, fontWeight: 500,
                  color: C.ivory, marginBottom: 20, letterSpacing: '0.06em',
                }}>
                  {item.title}
                </h3>
                <div style={{ width: 28, height: 1, background: C.gold, marginBottom: 20 }} />
                <p style={{ fontSize: 13, lineHeight: 1.9, color: '#9a9080' }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICE ─────────────────────────────────── */}
      <section id="service" ref={el => sectionRefs.current['service'] = el}
        className="fade-section"
        style={{
          minHeight: '80vh', display: 'flex', alignItems: 'center',
          padding: '100px 80px', background: C.cream,
          opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <SectionLabel en="Services" ja="サービス内容" light />
          <h2 style={headingStyle(C.charcoal)}>2つの提携方法</h2>
          <div style={{ width: 40, height: 2, background: C.gold, marginBottom: 64 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {[
              { method: '提携方法 01', title: '非対面式受注', sub: 'フリーサイズデザインサンプルによる', tag: '簡単スタート' },
              { method: '提携方法 02', title: '対面式受注', sub: 'フルオーダーによる出張対応', tag: '完全フルオーダー' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '48px 40px', background: C.warmWhite,
                borderLeft: `3px solid ${C.gold}`,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <span style={{ fontFamily: "'Cormorant Garamond'", fontSize: 13, color: C.gold, letterSpacing: '0.2em' }}>{item.method}</span>
                <h3 style={{ fontFamily: "'Noto Serif JP'", fontSize: 24, fontWeight: 500, color: C.charcoal }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: C.muted }}>{item.sub}</p>
                <span style={{
                  display: 'inline-block', padding: '4px 16px', background: `${C.gold}15`,
                  border: `1px solid ${C.gold}40`, color: C.goldDark, fontSize: 12, letterSpacing: '0.05em',
                  alignSelf: 'flex-start', marginTop: 8,
                }}>{item.tag}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 40, fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 2 }}>
            メンズ・レディース問わず対応 ／ 一点物〜複数着まで柔軟に対応
          </p>
        </div>
      </section>

      {/* ── METHOD 1 ────────────────────────────────── */}
      <section id="method1" ref={el => sectionRefs.current['method1'] = el}
        className="fade-section"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          padding: '100px 80px', background: C.warmWhite,
          opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <SectionLabel en="Method 01" ja="提携方法1" light />
          <h2 style={headingStyle(C.charcoal)}>非対面式受注</h2>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>フリーサイズデザインサンプルによる</p>
          <div style={{ width: 40, height: 2, background: C.gold, marginBottom: 64 }} />
          <FlowChart steps={[
            { n: 1, title: 'サンプル展示', desc: 'S〜Lにフィットするフリーサイズサンプルを店内またはHP上に展示' },
            { n: 2, title: '受注（丈調整）', desc: 'お客様の体型に合わせて丈だけの簡単な調整で受注' },
            { n: 3, title: '資材発注', desc: '受注内容に基づいて必要な資材を発注' },
            { n: 4, title: 'エイムローズで製作', desc: '熟練職人が丁寧に製作' },
            { n: 5, title: '納品', desc: '納期は材料が揃ってから1ヶ月半〜2ヶ月' },
          ]} />
          <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { name: 'コート', sample: '¥50,000', normal: '¥100,000' },
              { name: 'スーツ', sample: '¥50,000', normal: '¥100,000' },
              { name: 'ジャケット', sample: '¥35,000', normal: '¥70,000' },
              { name: 'ブラウス', sample: '¥25,000', normal: '¥50,000' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '24px', background: C.cream, textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontFamily: "'Noto Serif JP'", fontWeight: 500, color: C.charcoal, marginBottom: 12 }}>{item.name}</p>
                <p style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>サンプル特別価格</p>
                <p style={{ fontSize: 18, color: C.gold, fontFamily: "'Cormorant Garamond'", fontWeight: 500 }}>{item.sample}</p>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>通常 {item.normal}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: 12, color: C.muted, textAlign: 'center' }}>※税別 ／ 全てS〜L対応 ／ 生地はご準備ください ／ 丈調整 +¥1,000/箇所</p>
        </div>
      </section>

      {/* ── METHOD 2 ────────────────────────────────── */}
      <section id="method2" ref={el => sectionRefs.current['method2'] = el}
        className="fade-section"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          padding: '100px 80px', background: C.charcoal,
          opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <SectionLabel en="Method 02" ja="提携方法2" />
          <h2 style={headingStyle(C.ivory)}>フルオーダー対面式受注</h2>
          <div style={{ width: 40, height: 2, background: C.gold, marginBottom: 64 }} />
          <FlowChart dark steps={[
            { n: 1, title: 'お客様からの依頼', desc: 'フルオーダーの依頼を受けます' },
            { n: 2, title: 'エイムローズに出張依頼', desc: 'オーダー日を決定' },
            { n: 3, title: 'オーダー当日', desc: '御社に訪問し、共同で受注' },
            { n: 4, title: '仮縫い 1〜2回', desc: 'お客様の体型に合わせて細かな調整' },
            { n: 5, title: 'エイムローズで製作', desc: '納期は2〜3ヶ月（仮縫いのタイミングにより前後）' },
            { n: 6, title: '納品', desc: '完成した高品質なフルオーダー製品をお届け' },
          ]} />
          <div style={{ marginTop: 60, padding: '32px 40px', background: '#181614', borderLeft: `3px solid ${C.gold}` }}>
            <p style={{ color: C.textLight, fontSize: 13, lineHeight: 2 }}>
              <strong style={{ color: C.goldLight }}>出張費：</strong>
              近距離（20km以内）¥10,000 + 交通費 ／
              中距離（〜50km）¥20,000 + 交通費 ／
              長距離（50km以上）¥40,000 + 交通費
              ＊受注日・仮縫い日の計2〜3回分含む
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section id="pricing" ref={el => sectionRefs.current['pricing'] = el}
        className="fade-section"
        style={{
          minHeight: '80vh', display: 'flex', alignItems: 'center',
          padding: '100px 80px', background: C.cream,
          opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <SectionLabel en="Pricing" ja="料金表" light />
          <h2 style={headingStyle(C.charcoal)}>フルオーダー料金</h2>
          <div style={{ width: 40, height: 2, background: C.gold, marginBottom: 64 }} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: C.warmWhite }}>
            <thead>
              <tr style={{ background: C.charcoal, color: C.ivory }}>
                <th style={thStyle}>アイテム</th>
                <th style={thStyle}>パターン価格（税別）</th>
                <th style={thStyle}>製作価格（税別）</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['コート', '¥55,000〜', '¥90,000〜'],
                ['ジャケット・ブルゾン', '¥50,000〜', '¥70,000〜'],
                ['ワンピース', '¥45,000〜', '¥60,000〜'],
                ['パンツ・スカート', '¥35,000〜', '¥30,000〜'],
                ['シャツ', '¥35,000〜', '¥35,000〜'],
              ].map(([name, pat, make], i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                  <td style={tdStyle}>{name}</td>
                  <td style={{ ...tdStyle, color: C.goldDark, fontFamily: "'Cormorant Garamond'", fontSize: 16 }}>{pat}</td>
                  <td style={{ ...tdStyle, color: C.goldDark, fontFamily: "'Cormorant Garamond'", fontSize: 16 }}>{make}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 32, padding: '24px 32px', background: `${C.gold}10`, border: `1px solid ${C.gold}30` }}>
            <p style={{ fontSize: 13, color: C.charcoal, lineHeight: 2 }}>
              ✦ 革の場合 別途 ¥20,000 ／ 柄合わせ 別途 ¥10,000<br />
              ✦ 2着目以降、同じパターンはパターン代不要<br />
              ✦ <strong>ご紹介リピート時 → 御社に20%キャッシュバック</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── WHOLESALE ───────────────────────────────── */}
      <section id="wholesale" ref={el => sectionRefs.current['wholesale'] = el}
        className="fade-section"
        style={{
          padding: '100px 80px', background: C.warmWhite,
          opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionLabel en="Wholesale" ja="卸販売" light />
          <h2 style={headingStyle(C.charcoal)}>アクセサリー卸</h2>
          <div style={{ width: 40, height: 2, background: C.gold, marginBottom: 64 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { name: 'ポケットチーフ', desc: '1柄：定価 ¥2,900 → 卸値 ¥1,450\n2柄：定価 ¥3,500 → 卸値 ¥1,750' },
              { name: 'ミニネクタイ', desc: '定価 ¥3,900 → 卸値 ¥1,950' },
              { name: 'ミニ蝶ネクタイ', desc: '定価 ¥3,900 → 卸値 ¥1,950' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '36px', background: C.cream, borderTop: `2px solid ${C.gold}` }}>
                <h3 style={{ fontFamily: "'Noto Serif JP'", fontSize: 18, color: C.charcoal, marginBottom: 20 }}>{item.name}</h3>
                <pre style={{ fontSize: 13, color: C.slate, whiteSpace: 'pre-wrap', lineHeight: 2, fontFamily: 'inherit' }}>{item.desc}</pre>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: 12, color: C.muted, textAlign: 'center' }}>
            ※税別 ／ 最低発注 ¥10,000 ／ 送料別途 ／ aimrose.official.ec
          </p>
        </div>
      </section>

      {/* ── STEPS ───────────────────────────────────── */}
      <section id="steps" ref={el => sectionRefs.current['steps'] = el}
        className="fade-section"
        style={{
          minHeight: '80vh', display: 'flex', alignItems: 'center',
          padding: '100px 80px', background: C.charcoal,
          opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <SectionLabel en="Getting Started" ja="提携開始までのステップ" />
          <h2 style={headingStyle(C.ivory)}>今すぐ始められます</h2>
          <div style={{ width: 40, height: 2, background: C.gold, marginBottom: 64 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            {[
              { n: '01', title: '提携方法1の場合', desc: 'サンプル製作を行い、その後、受注方法の指導をさせていただきます。' },
              { n: '02', title: '提携方法2の場合', desc: '特別な準備は不要です。お客様からのフルオーダー依頼があった際に随時対応いたします。' },
              { n: '03', title: '契約手続き', desc: '提携内容の詳細について協議し、双方の合意のもと契約を締結いたします。' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '48px 36px', background: '#181614' }}>
                <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: 56, fontWeight: 300, color: `${C.gold}30`, lineHeight: 1, marginBottom: 20 }}>{item.n}</div>
                <h3 style={{ fontFamily: "'Noto Serif JP'", fontSize: 17, color: C.ivory, marginBottom: 16 }}>{item.title}</h3>
                <div style={{ width: 24, height: 1, background: C.gold, marginBottom: 16 }} />
                <p style={{ fontSize: 13, color: '#8a8070', lineHeight: 1.9 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ─────────────────────────────────── */}
      <section id="contact" ref={el => sectionRefs.current['contact'] = el}
        className="fade-section"
        style={{
          minHeight: '70vh', display: 'flex', alignItems: 'center',
          padding: '100px 80px',
          background: `linear-gradient(135deg, ${C.charcoal} 0%, #2a1f14 100%)`,
          opacity: 0, transform: 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease',
          position: 'relative', overflow: 'hidden',
        }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '20%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: `${C.gold}08` }} />
        </div>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <SectionLabel en="Contact" ja="お問い合わせ" />
          <h2 style={{ ...headingStyle(C.ivory), marginBottom: 48 }}>ご質問・ご相談はお気軽に</h2>
          <div style={{ padding: '48px 60px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.gold}30` }}>
            <p style={{ fontFamily: "'Cormorant Garamond'", fontSize: 22, color: C.goldLight, marginBottom: 8 }}>株式会社 aim-rose（エイムローズ）</p>
            <div style={{ width: 40, height: 1, background: C.gold, margin: '0 auto 32px' }} />
            {[
              ['住所', '〒542-0081 大阪市中央区南船場2-2-28 ジェイ・プライド順慶ビル205'],
              ['TEL', '06-6261-7373'],
              ['FAX', '06-6261-7372'],
              ['HP', 'https://aim-rose-order.com/'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 12, fontSize: 13 }}>
                <span style={{ color: C.gold, minWidth: 40, textAlign: 'right' }}>{label}</span>
                <span style={{ color: '#c8bfb0' }}>{val}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 32, fontSize: 13, color: C.textDim }}>提携店様専用公式ラインもございます</p>
        </div>
      </section>

    </div>
  )
}

// ─── PRESENTER VIEW ─────────────────────────────────────────────────────────
function PresenterView() {
  const [current, setCurrent] = useState(0)
  const [bantChecked, setBantChecked] = useState({})
  const [openObjection, setOpenObjection] = useState(null)
  const sendSync = useSyncSend()

  useEffect(() => {
    const sec = P_SECTIONS[current]
    if (sec.customerSection && CUSTOMER_MAP[sec.customerSection]) {
      sendSync(CUSTOMER_MAP[sec.customerSection])
    }
  }, [current])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, P_SECTIONS.length - 1))
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sec = P_SECTIONS[current]
  const progress = (current / (P_SECTIONS.length - 1)) * 100

  const toggleBant = (id) => setBantChecked(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div style={{
      background: C.bg, color: C.textLight, fontFamily: "'Noto Sans JP', sans-serif",
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: C.surface, borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            padding: '4px 12px', background: `${C.gold}20`, border: `1px solid ${C.gold}50`,
            color: C.goldLight, fontSize: 11, letterSpacing: '0.1em', fontFamily: "'DM Mono'",
          }}>PRESENTER MODE</span>
          <span style={{ color: C.textDim, fontSize: 12, fontFamily: "'Cormorant Garamond'" }}>aim-rose 提携プレゼン</span>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{
          padding: '6px 16px', background: 'none', border: `1px solid ${C.border}`,
          color: C.textMid, fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
          transition: 'border-color 0.2s, color 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.goldLight }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid }}
        >
          ↗ 顧客画面を開く
        </a>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 2, background: C.border, flexShrink: 0 }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: `linear-gradient(90deg, ${C.goldDark}, ${C.goldLight})`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', overflow: 'auto', background: C.surface,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        scrollbarWidth: 'none',
      }}>
        {P_SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(i)} style={{
            padding: '10px 18px', background: 'none', border: 'none',
            borderBottom: i === current ? `2px solid ${C.gold}` : '2px solid transparent',
            color: i === current ? C.goldLight : C.textDim, cursor: 'pointer',
            fontSize: 11, letterSpacing: '0.05em', whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Sync indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span style={{
            padding: '3px 10px', fontSize: 11, fontFamily: "'DM Mono'",
            background: sec.customerSection ? `${C.gold}15` : '#1a2a1a',
            border: `1px solid ${sec.customerSection ? C.gold + '40' : '#2a4a2a'}`,
            color: sec.customerSection ? C.gold : '#4a8a4a',
          }}>
            {sec.customerSection ? '🔗 顧客画面と連動' : '📋 カンペのみ'}
          </span>
          <span style={{ fontFamily: "'Cormorant Garamond'", fontSize: 24, color: C.textLight, fontStyle: 'italic' }}>
            {sec.label}
          </span>
          <span style={{ color: C.textDim, fontSize: 11, fontFamily: "'DM Mono'" }}>
            {current + 1} / {P_SECTIONS.length}
          </span>
        </div>

        {/* Script */}
        {sec.script && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: C.textDim, letterSpacing: '0.1em', marginBottom: 8, fontFamily: "'DM Mono'" }}>台本</div>
            <pre style={{
              background: '#0d1a0d', border: `1px solid #1a3a1a`,
              padding: '24px', fontSize: 13.5, lineHeight: 2, color: '#b8e0b8',
              whiteSpace: 'pre-wrap', fontFamily: "'Noto Sans JP'", borderRadius: 0,
            }}>
              {sec.script}
            </pre>
          </div>
        )}

        {/* BANT Checklist */}
        {sec.bant && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: C.textDim, letterSpacing: '0.1em', marginBottom: 12, fontFamily: "'DM Mono'" }}>BANTチェックリスト</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {BANT_ITEMS.map(item => (
                <label key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer',
                  padding: '14px 18px',
                  background: bantChecked[item.id] ? '#0f200f' : '#141210',
                  border: `1px solid ${bantChecked[item.id] ? '#2a5a2a' : C.border}`,
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 18, height: 18, border: `1px solid ${bantChecked[item.id] ? '#4a8a4a' : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2, background: bantChecked[item.id] ? '#2a5a2a' : 'transparent',
                  }}>
                    {bantChecked[item.id] && <span style={{ color: '#7adc7a', fontSize: 11 }}>✓</span>}
                  </div>
                  <span style={{
                    fontSize: 13, lineHeight: 1.7, color: bantChecked[item.id] ? '#6ab06a' : C.textMid,
                    textDecoration: bantChecked[item.id] ? 'line-through' : 'none',
                  }}>{item.label}</span>
                  <input type="checkbox" checked={!!bantChecked[item.id]} onChange={() => toggleBant(item.id)} style={{ display: 'none' }} />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Objections */}
        {sec.objections && (
          <div>
            <div style={{ fontSize: 11, color: C.textDim, letterSpacing: '0.1em', marginBottom: 12, fontFamily: "'DM Mono'" }}>切り返しトーク</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OBJECTIONS.map((obj, i) => (
                <div key={i}>
                  <button onClick={() => setOpenObjection(openObjection === i ? null : i)} style={{
                    width: '100%', padding: '14px 18px', background: '#141210',
                    border: `1px solid ${openObjection === i ? C.gold + '50' : C.border}`,
                    color: openObjection === i ? C.goldLight : C.textMid, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 13, fontFamily: "'Noto Sans JP'", textAlign: 'left',
                    transition: 'all 0.2s',
                  }}>
                    <span>🚫 「{obj.trigger}」と言われたら</span>
                    <span style={{ fontSize: 10, fontFamily: "'DM Mono'" }}>{openObjection === i ? '▲' : '▼'}</span>
                  </button>
                  {openObjection === i && (
                    <div style={{
                      padding: '20px 20px 20px 36px',
                      background: '#16120e', border: `1px solid ${C.gold}30`, borderTop: 'none',
                      fontSize: 13, lineHeight: 2, color: '#c8b890',
                    }}>
                      {obj.response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', background: C.surface, borderTop: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <button onClick={() => setCurrent(c => Math.max(c - 1, 0))} disabled={current === 0} style={{
          padding: '10px 28px', background: 'none',
          border: `1px solid ${current === 0 ? C.border : C.gold + '60'}`,
          color: current === 0 ? C.textDim : C.goldLight, cursor: current === 0 ? 'not-allowed' : 'pointer',
          fontSize: 12, letterSpacing: '0.08em', fontFamily: "'Noto Sans JP'",
          transition: 'all 0.2s',
        }}>← 前へ</button>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {P_SECTIONS.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? 20 : 6, height: 6,
              background: i === current ? C.gold : C.border,
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s ease', borderRadius: 3,
            }} />
          ))}
        </div>

        <button onClick={() => setCurrent(c => Math.min(c + 1, P_SECTIONS.length - 1))} disabled={current === P_SECTIONS.length - 1} style={{
          padding: '10px 28px',
          background: current === P_SECTIONS.length - 1 ? 'none' : `linear-gradient(135deg, ${C.goldDark}, ${C.goldLight})`,
          border: `1px solid ${current === P_SECTIONS.length - 1 ? C.border : 'transparent'}`,
          color: current === P_SECTIONS.length - 1 ? C.textDim : C.charcoal,
          cursor: current === P_SECTIONS.length - 1 ? 'not-allowed' : 'pointer',
          fontSize: 12, letterSpacing: '0.08em', fontFamily: "'Noto Sans JP'",
          transition: 'all 0.2s',
        }}>次へ →</button>
      </div>
    </div>
  )
}

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────
function SectionLabel({ en, ja, light }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: "'Cormorant Garamond'", fontSize: 11, letterSpacing: '0.3em',
        color: C.gold, textTransform: 'uppercase', marginBottom: 8,
      }}>{en}</div>
    </div>
  )
}

function FlowChart({ steps, dark }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, border: `2px solid ${C.gold}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Cormorant Garamond'", fontSize: 16, color: C.gold, fontWeight: 500,
              background: dark ? C.bg : C.warmWhite, flexShrink: 0,
            }}>{step.n}</div>
            {i < steps.length - 1 && (
              <div style={{ width: 1, height: 40, background: `${C.gold}40` }} />
            )}
          </div>
          <div style={{ paddingTop: 8, paddingBottom: 32 }}>
            <h4 style={{
              fontFamily: "'Noto Serif JP'", fontSize: 15, fontWeight: 500,
              color: dark ? C.ivory : C.charcoal, marginBottom: 6,
            }}>{step.title}</h4>
            <p style={{ fontSize: 13, color: dark ? '#8a8070' : C.muted, lineHeight: 1.7 }}>{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function headingStyle(color) {
  return {
    fontFamily: "'Cormorant Garamond'", fontSize: 'clamp(28px, 4vw, 48px)',
    fontWeight: 300, color, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.01em',
  }
}
const thStyle = { padding: '14px 20px', textAlign: 'left', fontSize: 12, letterSpacing: '0.08em', fontWeight: 500 }
const tdStyle = { padding: '16px 20px', fontSize: 14, borderBottom: '1px solid #ede7d9', color: C.charcoal }

// ─── APP ROOT ───────────────────────────────────────────────────────────────
export default function App() {
  const [route, setRoute] = useState(getRoute())
  useEffect(() => {
    const handler = () => setRoute(getRoute())
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])
  return route === 'presenter' ? <PresenterView /> : <CustomerView />
}
