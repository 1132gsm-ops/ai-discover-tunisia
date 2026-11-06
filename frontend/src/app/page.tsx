"use client";

import { useEffect, useState } from "react";

const navigation = [
  { id: "dashboard", icon: "▦", label: "لوحة القيادة" },
  { id: "team", icon: "♙", label: "فريق الذكاء الاصطناعي" },
  { id: "projects", icon: "▣", label: "المشاريع" },
  { id: "content", icon: "▤", label: "استوديو المحتوى" },
  { id: "marketing", icon: "◉", label: "التسويق والنمو" },
  { id: "finance", icon: "◈", label: "المالية والأرباح" },
  { id: "commands", icon: "✦", label: "أوامر AI CEO" },
  { id: "settings", icon: "⚙", label: "الإعدادات" },
];

const agents = [
  { name: "AI CEO", role: "المدير التنفيذي", icon: "👨‍💼", color: "purple", status: "نشط", task: "متابعة استراتيجية الشركة" },
  { name: "Marketing Manager", role: "مدير التسويق", icon: "📈", color: "blue", status: "نشط", task: "إعداد خطة التسويق" },
  { name: "Content Creator", role: "صانع المحتوى", icon: "🎬", color: "pink", status: "نشط", task: "تحضير أفكار الفيديوهات" },
  { name: "Video Editor", role: "مونتير الفيديو", icon: "🎞️", color: "orange", status: "في الانتظار", task: "في انتظار مشروع جديد" },
  { name: "SEO Specialist", role: "خبير SEO", icon: "🔎", color: "green", status: "نشط", task: "تحليل الكلمات المفتاحية" },
  { name: "Social Media Manager", role: "مدير الشبكات الاجتماعية", icon: "📱", color: "cyan", status: "في الانتظار", task: "في انتظار المحتوى" },
];

const initialTasks = [
  { title: "إعداد خطة المحتوى لشهر نوفمبر", department: "التسويق", priority: "عالية", status: "قيد التخطيط" },
  { title: "إنشاء أول 10 فيديوهات AI", department: "استوديو المحتوى", priority: "عالية", status: "جديدة" },
  { title: "تحليل الجمهور المستهدف في تونس", department: "البحوث", priority: "متوسطة", status: "قيد التخطيط" },
];

const sectionNames: Record<string, string> = {
  dashboard: "لوحة القيادة",
  team: "فريق الذكاء الاصطناعي",
  projects: "المشاريع",
  content: "استوديو المحتوى",
  marketing: "التسويق والنمو",
  finance: "المالية والأرباح",
  commands: "أوامر AI CEO",
  settings: "الإعدادات",
};

export default function Home() {
  const [active, setActive] = useState("dashboard");
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "fallback">("loading");
  const [stats, setStats] = useState<{ commands: number; tasks: number }>({ commands: 0, tasks: 0 });

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    let cancelled = false;
    fetch(`${apiUrl}/api/tasks`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((t: any) => ({
            title: t.title,
            department: t.department,
            priority: "عالية",
            status: t.status,
          }));
          setTasks(mapped);
          setApiStatus("ok");
        } else {
          setApiStatus("ok");
        }
      })
      .catch(() => {
        if (!cancelled) setApiStatus("fallback");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ========== AI CEO Command ==========
  const [commandText, setCommandText] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [lastAnalysis, setLastAnalysis] = useState<{ analysis: string; department: string } | null>(null);
  const [commands, setCommands] = useState<Array<{ id: number; text: string; department: string; analysis: string }>>([]);

  // ========== AI CEO Commands Page ==========
  const [allCommands, setAllCommands] = useState<Array<{ id: number; text: string; department: string; analysis: string; status: string }>>([]);
  const [commandsLoading, setCommandsLoading] = useState(false);
  const [commandsError, setCommandsError] = useState("");
  const [filterDept, setFilterDept] = useState<string>("all");

  const loadAllCommands = async () => {
    setCommandsLoading(true);
    setCommandsError("");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.102:8000";
    try {
      const res = await fetch(`${apiUrl}/api/ceo/commands`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAllCommands(data);
    } catch (e: any) {
      setCommandsError(e.message || "تعذّر تحميل الأوامر");
    } finally {
      setCommandsLoading(false);
    }
  };

  const updateCommandStatus = async (id: number, status: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.102:8000";
    try {
      const res = await fetch(`${apiUrl}/api/ceo/commands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAllCommands((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch {
      alert("تعذّر تحديث حالة الأمر");
    }
  };

  const deleteCommand = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الأمر؟")) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.102:8000";
    try {
      const res = await fetch(`${apiUrl}/api/ceo/commands/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAllCommands((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("تعذّر حذف الأمر");
    }
  };

  useEffect(() => {
    if (active === "commands") {
      loadAllCommands();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ========== System Health ==========
  const [health, setHealth] = useState<{
    api: string;
    postgres: string;
    redis: string;
  } | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.102:8000";

    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiUrl}/health`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHealth(data);
      } catch {
        setHealth({ api: "error", postgres: "unknown", redis: "unknown" });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // stats
  useEffect(() => {
    if (active !== "settings") return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.102:8000";
    Promise.all([
      fetch(`${apiUrl}/api/ceo/commands`).then(r => r.json()),
      fetch(`${apiUrl}/api/tasks`).then(r => r.json()),
    ])
      .then(([cmds, tasks]) => {
        setStats({
          commands: Array.isArray(cmds) ? cmds.length : 0,
          tasks: Array.isArray(tasks) ? tasks.length : 0,
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const submitCommand = async () => {
    if (!commandText.trim() || submitStatus === "sending") return;
    setSubmitStatus("sending");
    setLastAnalysis(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.102:8000";

    try {
      const res = await fetch(`${apiUrl}/api/ceo/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commandText.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setLastAnalysis({ analysis: data.analysis, department: data.department });
      setCommands((prev) => [
        { id: data.id, text: data.text, department: data.department, analysis: data.analysis },
        ...prev,
      ]);
      setCommandText("");
      setSubmitStatus("sent");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch {
      setSubmitStatus("error");
    }
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">AI</div>
          <div>
            <div className="brand-name">AI DISCOVER</div>
            <div className="brand-sub">TUNISIA <span>●</span></div>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-icon">✦</div>
          <div>
            <strong>AI Agency</strong>
            <small>المقر الرئيسي</small>
          </div>
          <span className="workspace-arrow">⌄</span>
        </div>

        <div className="nav-label">القائمة الرئيسية</div>
        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`nav-item ${active === item.id ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {active === item.id && <span className="active-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <div className="system-status-title">
              <span className={`status-dot ${health && health.api === "ok" ? "online" : "offline"}`} />
              <strong>
                {health && health.api === "ok" ? "النظام يعمل" : health ? "فمّا مشكل" : "جاري الفحص..."}
              </strong>
            </div>
            <div className="system-status-grid">
              <div className="system-status-item">
                <span className={`mini-dot ${health && health.api === "ok" ? "online" : "offline"}`} />
                <span>Backend</span>
              </div>
              <div className="system-status-item">
                <span className={`mini-dot ${health && health.postgres === "ok" ? "online" : "offline"}`} />
                <span>PostgreSQL</span>
              </div>
              <div className="system-status-item">
                <span className={`mini-dot ${health && health.redis === "ok" ? "online" : "offline"}`} />
                <span>Redis</span>
              </div>
              <div className="system-status-item">
                <span className="mini-dot online" />
                <span>Frontend</span>
              </div>
            </div>
          </div>
          <div className="user-profile">
            <div className="user-avatar">M</div>
            <div className="user-info">
              <strong>مدير الشركة</strong>
              <small>Administrator</small>
            </div>
            <span className="more-icon">•••</span>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>AI Discover Tunisia</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{sectionNames[active]}</strong>
          </div>
          <div className="top-actions">
            <div className="date-label">الأربعاء، 4 نوفمبر 2026</div>
            <button className="icon-button" aria-label="الإشعارات">♧<i /></button>
            <div className="top-avatar">M</div>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><span className="live-dot" /> AI AGENCY COMMAND CENTER</div>
              <h1>{active === "dashboard" ? "مرحباً بك في مركز القيادة" : sectionNames[active]}</h1>
              <p className="welcome-description">
                {active === "dashboard"
                  ? "تابع فريقك الذكي، مشاريعك، وأداء شركتك من مكان واحد."
                  : `إدارة ومتابعة ${sectionNames[active]} في شركتك الذكية.`}
              </p>
            </div>
            <button className="primary-button" onClick={() => setActive("projects")}>
              <span>＋</span> مشروع جديد
            </button>
          </div>

          {active === "dashboard" && (
            <>
              <div className="ceo-card">
                <div className="ceo-glow" />
                <div className="ceo-content">
                  <div className="ceo-label"><span>✦</span> YOUR AI EXECUTIVE</div>
                  <h2>المدير التنفيذي الذكي</h2>
                  <p>
                    أنا المدير التنفيذي الافتراضي لـ AI Discover Tunisia.
                    مهمتي تنظيم العمل، متابعة الفريق، ومساعدتك على تحقيق أهداف الشركة.
                  </p>
                  <div className="ceo-actions">
                    <button className="ceo-button" onClick={() => setActive("team")}>استكشف فريق العمل <span>←</span></button>
                    <span className="ceo-availability"><i /> جاهز للعمل</span>
                  </div>
                </div>
                <div className="ceo-visual">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="ceo-core">AI</div>
                  <div className="orbit-dot dot-one" />
                  <div className="orbit-dot dot-two" />
                  <div className="orbit-dot dot-three" />
                </div>
                <div className="ceo-version">AI CEO <span>V1.0</span></div>
              </div>

              <div className="ceo-composer">
                <div className="ceo-composer-header">
                  <span className="ceo-composer-title">◈ اطلب من المدير التنفيذي</span>
                  <span className="ceo-composer-hint">اكتب أمرك بالعربية</span>
                </div>
                <div className="ceo-composer-row">
                  <textarea
                    className="ceo-composer-input"
                    placeholder="مثال: أعمل حملة تسويق على TikTok..."
                    value={commandText}
                    onChange={(e) => setCommandText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitCommand();
                    }}
                    rows={2}
                  />
                  <button
                    className="ceo-composer-btn"
                    onClick={submitCommand}
                    disabled={submitStatus === "sending" || !commandText.trim()}
                  >
                    {submitStatus === "sending" ? "..." : "أرسل ←"}
                  </button>
                </div>
                {submitStatus === "error" && (
                  <div className="ceo-composer-msg error">تعذّر الاتصال بالمدير التنفيذي.</div>
                )}
                {lastAnalysis && (
                  <div className="ceo-composer-response">
                    <div className="ceo-composer-dept">القسم المسؤول: <strong>{lastAnalysis.department}</strong></div>
                    <div className="ceo-composer-analysis">{lastAnalysis.analysis}</div>
                  </div>
                )}
                {commands.length > 0 && (
                  <div className="ceo-composer-recent">
                    <div className="ceo-composer-recent-title">أوامر حديثة</div>
                    {commands.slice(0, 3).map((c) => (
                      <div className="ceo-composer-recent-row" key={c.id}>
                        <span className="ceo-composer-recent-text">{c.text}</span>
                        <span className="ceo-composer-recent-dept">{c.department}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="section-heading">
                <div><h3>نظرة عامة على الشركة</h3><p>ملخص نشاط الشركة</p></div>
                <span className="period-label">بيانات تجريبية · النسخة الأولى</span>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top"><span>فريق الذكاء الاصطناعي</span><span className="stat-icon purple-bg">♙</span></div>
                  <div className="stat-number">06 <small>موظفين</small></div>
                  <div className="stat-foot"><span className="positive">● 4 نشطين</span><span>من أصل 6</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>المشاريع</span><span className="stat-icon blue-bg">▣</span></div>
                  <div className="stat-number">03 <small>مشاريع</small></div>
                  <div className="stat-foot"><span className="neutral">قيد الإعداد</span><span>هذا الشهر</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>المحتوى المنشور</span><span className="stat-icon pink-bg">▶</span></div>
                  <div className="stat-number">00 <small>فيديو</small></div>
                  <div className="stat-foot"><span className="neutral">في انتظار الإطلاق</span><span>TikTok / YouTube</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>إجمالي الأرباح</span><span className="stat-icon green-bg">◈</span></div>
                  <div className="stat-number">0.00 <small>TND</small></div>
                  <div className="stat-foot"><span className="neutral">لم يتم تسجيل مداخيل</span><span>هذا الشهر</span></div>
                </div>
              </div>

              <div className="content-grid">
                <section className="panel team-panel">
                  <div className="panel-heading">
                    <div><h3>فريق العمل الذكي</h3><p>موظفو شركتك الافتراضية</p></div>
                    <button className="text-button" onClick={() => setActive("team")}>عرض الكل ←</button>
                  </div>
                  <div className="agent-list">
                    {agents.slice(0, 4).map((agent) => (
                      <div className="agent-row" key={agent.name}>
                        <div className={`agent-avatar ${agent.color}`}>{agent.icon}</div>
                        <div className="agent-details"><strong>{agent.name}</strong><small>{agent.role}</small></div>
                        <div className={`agent-status ${agent.status === "نشط" ? "online" : "waiting"}`}>
                          <i /> {agent.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel tasks-panel">
                  <div className="panel-heading">
                    <div><h3>المهام الأخيرة</h3><p>متابعة سير العمل</p></div>
                    <button className="text-button" onClick={() => setActive("projects")}>كل المهام ←</button>
                  </div>
                  <div className="task-list">
                    {tasks.map((task, index) => (
                      <div className="task-row" key={task.title}>
                        <div className={`task-number task-${index + 1}`}>0{index + 1}</div>
                        <div className="task-details"><strong>{task.title}</strong><small>{task.department} · {task.priority}</small></div>
                        <span className="task-status">{task.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {active === "team" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div><h3>موظفو الشركة</h3><p>الفريق الافتراضي لـ AI Discover Tunisia</p></div>
                <span className="period-label">6 موظفين</span>
              </div>
              <div className="agents-grid">
                {agents.map((agent) => (
                  <div className="agent-card" key={agent.name}>
                    <div className={`agent-avatar large ${agent.color}`}>{agent.icon}</div>
                    <h3>{agent.name}</h3><p>{agent.role}</p>
                    <div className={`agent-status ${agent.status === "نشط" ? "online" : "waiting"}`}><i /> {agent.status}</div>
                    <div className="agent-task">{agent.task}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "projects" && (
            <section className="panel full-panel">
              <div className="panel-heading"><div><h3>المشاريع والمهام</h3><p>متابعة أعمال الشركة</p></div><span className="period-label">3 مهام تجريبية</span></div>
              {tasks.map((task, index) => (
                <div className="project-row" key={task.title}>
                  <div className="task-number">0{index + 1}</div>
                  <div className="task-details"><strong>{task.title}</strong><small>{task.department}</small></div>
                  <span className="task-status">{task.status}</span>
                </div>
              ))}
            </section>
          )}

          {active === "commands" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h3>أوامر AI CEO</h3>
                  <p>كل الأوامر اللي استقبلها المدير التنفيذي</p>
                </div>
                <button className="primary-button" onClick={loadAllCommands} disabled={commandsLoading}>
                  {commandsLoading ? "..." : "تحديث ↻"}
                </button>
              </div>

              <div className="commands-filters">
                <button className={`filter-btn ${filterDept === "all" ? "active" : ""}`} onClick={() => setFilterDept("all")}>الكل ({allCommands.length})</button>
                {["Marketing", "Content Studio", "Finance", "Research", "Engineering", "SEO", "General"].map((d) => {
                  const count = allCommands.filter((c) => c.department === d).length;
                  return (
                    <button key={d} className={`filter-btn ${filterDept === d ? "active" : ""}`} onClick={() => setFilterDept(d)}>
                      {d} ({count})
                    </button>
                  );
                })}
              </div>

              {commandsLoading && <div className="commands-empty">جاري التحميل...</div>}
              {commandsError && <div className="commands-empty error">{commandsError}</div>}
              {!commandsLoading && !commandsError && allCommands.length === 0 && (
                <div className="commands-empty">لا توجد أوامر بعد. اكتب أمرك في لوحة القيادة.</div>
              )}

              {!commandsLoading && !commandsError && allCommands.length > 0 && (
                <div className="commands-list">
                  {allCommands
                    .filter((c) => filterDept === "all" || c.department === filterDept)
                    .map((cmd) => (
                      <div className="command-card" key={cmd.id}>
                        <div className="command-header">
                          <span className="command-id">#{cmd.id}</span>
                          <span className="command-dept">{cmd.department}</span>
                          <select
                            className={`command-status-select status-${cmd.status}`}
                            value={cmd.status}
                            onChange={(e) => updateCommandStatus(cmd.id, e.target.value)}
                          >
                            <option value="pending">قيد الانتظار</option>
                            <option value="processing">قيد المعالجة</option>
                            <option value="done">مكتمل</option>
                          </select>
                        </div>
                        <div className="command-text">{cmd.text}</div>
                        <div className="command-analysis">{cmd.analysis}</div>
                        <div className="command-footer">
                          <button className="command-delete" onClick={() => deleteCommand(cmd.id)}>حذف</button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}

          {active !== "dashboard" && active !== "team" && active !== "projects" && active !== "commands" && (
            <section className="panel empty-panel">
              <div className="empty-icon">✦</div>
              <h2>{sectionNames[active]}</h2>
              <p>هذا القسم موجود في مخطط الشركة. سنقوم بتفعيل وظائفه وربطه بالنظام في المرحلة القادمة.</p>
              <span className="coming-soon">قيد التطوير</span>
              <button className="primary-button" onClick={() => setActive("dashboard")}>العودة إلى لوحة القيادة</button>
            </section>
          )}

          <footer className="footer">
            <span>© 2026 AI Discover Tunisia</span>
            <span>Built for the future <b>✦</b></span>
          </footer>
        </div>
      </section>
    </main>
  );
}
