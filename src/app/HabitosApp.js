'use client'
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "habitos-data-v1";

const COLORS = [
  { bg: "#FF6B6B", light: "#FFE5E5" },
  { bg: "#FF9F43", light: "#FFF3E0" },
  { bg: "#FECA57", light: "#FFFDE7" },
  { bg: "#48CAE4", light: "#E0F7FA" },
  { bg: "#06D6A0", light: "#E0FAF4" },
  { bg: "#A29BFE", light: "#EDE7F6" },
  { bg: "#FD79A8", light: "#FCE4EC" },
  { bg: "#00B4D8", light: "#E0F4FF" },
];

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_SEMANA_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DEFAULT_HABITS = [
  { id: "1", name: "No fumar", colorIdx: 4, createdAt: "2026-05-01", monthlyGoal: 20 },
  { id: "2", name: "No fumar 2 días seguidos", colorIdx: 5, createdAt: "2026-05-01", monthlyGoal: 4 },
  { id: "3", name: "Leer 15 páginas de un libro", colorIdx: 7, createdAt: "2026-05-01", monthlyGoal: 20 },
  { id: "4", name: "No tomar alcohol", colorIdx: 1, createdAt: "2026-05-01", monthlyGoal: 28 },
  { id: "5", name: "No tomar gaseosa", colorIdx: 3, createdAt: "2026-05-01", monthlyGoal: 28 },
  { id: "6", name: "Avanzar con proyectos", colorIdx: 2, createdAt: "2026-05-01", monthlyGoal: 20 },
  { id: "7", name: "Entrenar", colorIdx: 0, createdAt: "2026-05-01", monthlyGoal: 20 },
];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getMonthStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
}
function getDaysInMonth(year, month) { return new Date(year, month, 0).getDate(); }
function formatDate(str) { const [y,m,d] = str.split("-"); return `${d}/${m}/${y}`; }
function formatMonth(str) {
  const [y,m] = str.split("-");
  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${months[parseInt(m)-1]} ${y}`;
}
function getDayOfWeek(dateStr) {
  const [y,m,d] = dateStr.split("-").map(Number);
  return new Date(y, m-1, d).getDay();
}
function getLastNDays(n) {
  const days = [];
  for (let i = n-1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }
  return days;
}

const TAB = { HOY:"hoy", ESTADISTICAS:"stats", IA:"ia", HABITOS:"habitos" };

export default function HabitosApp() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState(TAB.HOY);
  const [aiMsg, setAiMsg] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitColor, setNewHabitColor] = useState(0);
  const [newHabitGoal, setNewHabitGoal] = useState(20);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getMonthStr());
  const [toast, setToast] = useState(null);
  const [daysBack, setDaysBack] = useState(7);
  const [selectedDay, setSelectedDay] = useState(getTodayStr());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setData(JSON.parse(stored));
      else setData({ habits: DEFAULT_HABITS, logs: {} });
    } catch {
      setData({ habits: DEFAULT_HABITS, logs: {} });
    }
  }, []);

  const save = useCallback((newData) => {
    setData(newData);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newData)); }
    catch (e) { console.error("Storage error", e); }
  }, []);

  const showToast = (msg, color = "#06D6A0") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const toggleHabit = (habitId, dateStr) => {
    const newData = { ...data, logs: { ...data.logs } };
    if (!newData.logs[dateStr]) newData.logs[dateStr] = {};
    const newVal = !newData.logs[dateStr][habitId];
    newData.logs[dateStr] = { ...newData.logs[dateStr], [habitId]: newVal };
    save(newData);
    if (newVal) {
      const habit = data.habits.find(h => h.id === habitId);
      const isToday = dateStr === getTodayStr();
      showToast(isToday ? `¡${habit?.name} cumplido! 🎉` : `✏️ ${formatDate(dateStr)} actualizado`);
    }
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const newHabit = { id: Date.now().toString(), name: newHabitName.trim(), colorIdx: newHabitColor, createdAt: getTodayStr(), monthlyGoal: newHabitGoal };
    save({ ...data, habits: [...data.habits, newHabit] });
    setNewHabitName(""); setNewHabitColor(0); setNewHabitGoal(20); setShowAddForm(false);
    showToast("¡Hábito creado! 🚀");
  };

  const updateHabitGoal = (habitId, goal) => {
    save({ ...data, habits: data.habits.map(h => h.id === habitId ? { ...h, monthlyGoal: goal } : h) });
    setEditingGoal(null);
    showToast("¡Meta actualizada! 🎯");
  };

  const deleteHabit = (habitId) => {
    save({ ...data, habits: data.habits.filter(h => h.id !== habitId) });
    showToast("Hábito eliminado", "#FF6B6B");
  };

  const moveHabit = (habitId, direction) => {
    const idx = data.habits.findIndex(h => h.id === habitId);
    if (idx === -1) return;
    const newHabits = [...data.habits];
    const swapIdx = direction === "up" ? idx-1 : idx+1;
    if (swapIdx < 0 || swapIdx >= newHabits.length) return;
    [newHabits[idx], newHabits[swapIdx]] = [newHabits[swapIdx], newHabits[idx]];
    save({ ...data, habits: newHabits });
  };

  const getMonthStats = (habitId, monthStr) => {
    const [y,m] = monthStr.split("-").map(Number);
    const days = getDaysInMonth(y, m);
    let count = 0;
    for (let d = 1; d <= days; d++) {
      const dateStr = `${monthStr}-${String(d).padStart(2,"0")}`;
      if (data?.logs?.[dateStr]?.[habitId]) count++;
    }
    const habit = data?.habits?.find(h => h.id === habitId);
    const goal = habit?.monthlyGoal || null;
    const goalPct = goal ? Math.min(Math.round((count/goal)*100), 100) : null;
    const exceeded = goal ? count > goal : false;
    return { count, total: days, pct: Math.round((count/days)*100), goal, goalPct, exceeded };
  };

  const getDayOfWeekStats = (habitId) => {
    const counts = Array(7).fill(0);
    const totals = Array(7).fill(0);
    if (!data) return { counts, totals };
    Object.keys(data.logs).forEach(dateStr => {
      const dow = getDayOfWeek(dateStr);
      totals[dow]++;
      if (data.logs[dateStr][habitId]) counts[dow]++;
    });
    return { counts, totals };
  };

  const getAllMonths = () => {
    if (!data) return [];
    const months = new Set(Object.keys(data.logs).map(d => d.slice(0,7)));
    months.add(getMonthStr());
    return Array.from(months).sort().reverse();
  };

  const getHabitStreak = (habitId) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      if (data?.logs?.[dateStr]?.[habitId]) { streak++; d.setDate(d.getDate()-1); }
      else break;
    }
    return streak;
  };

  const getGeneralStreak = () => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const logs = data?.logs?.[dateStr] || {};
      const anyDone = data?.habits?.some(h => logs[h.id]);
      if (anyDone) { streak++; d.setDate(d.getDate()-1); }
      else break;
    }
    return streak;
  };

  const buildAIContext = () => {
    const months = getAllMonths();
    const statsContext = data.habits.map(h => {
      const monthStats = months.slice(0,3).map(mo => {
        const s = getMonthStats(h.id, mo);
        const goalInfo = s.goal ? ` (meta: ${s.goal}, ${s.exceeded ? "¡SUPERADA!" : `faltan ${s.goal - s.count}`})` : "";
        return `${formatMonth(mo)}: ${s.count}/${s.total} días${goalInfo}`;
      }).join(", ");
      const { counts, totals } = getDayOfWeekStats(h.id);
      const dowStats = DIAS_SEMANA_FULL.map((name,i) =>
        totals[i] > 0 ? `${name}: ${counts[i]}/${totals[i]}` : null
      ).filter(Boolean).join(", ");
      return `- ${h.name}:\n  Meses: ${monthStats}\n  Por día de semana: ${dowStats || "sin datos aún"}`;
    }).join("\n");
    const today = getTodayStr();
    const todayLogs = data.logs[today] || {};
    const todayDone = data.habits.filter(h => todayLogs[h.id]).map(h => h.name).join(", ") || "ninguno";
    return { statsContext, today, todayDone };
  };

  const askAI = async (userMsg) => {
    if (!userMsg.trim()) return;
    setAiLoading(true);
    const newHistory = [...aiHistory, { role:"user", content:userMsg }];
    setAiHistory(newHistory);
    setAiMsg("");
    const { statsContext, today, todayDone } = buildAIContext();
    const systemPrompt = `Sos un coach de hábitos personal llamado HábitosAI. Sos empático, motivador y directo. Hablás en español argentino informal (usás "vos", "te", etc.).

Tenés acceso al historial completo del usuario:

HÁBITOS:
${data.habits.map(h => `- ${h.name}`).join("\n")}

ESTADÍSTICAS:
${statsContext}

HOY (${formatDate(today)}, ${DIAS_SEMANA_FULL[getDayOfWeek(today)]}):
Completados hoy: ${todayDone}

Tu rol: analizar patrones reales, dar consejos accionables, celebrar logros. Sé honesto y motivador. Máximo 180 palabras salvo que pidan algo extenso.`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, messages: newHistory }),
      });
      const result = await response.json();
      setAiHistory([...newHistory, { role:"assistant", content: result.reply || "No pude procesar la respuesta." }]);
    } catch {
      setAiHistory([...newHistory, { role:"assistant", content:"Hubo un error al conectar con la IA. Intentá de nuevo." }]);
    }
    setAiLoading(false);
  };

  if (!data) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0F0F1A", color:"#fff", fontFamily:"system-ui" }}>
        <div style={{ textAlign:"center" }}><div style={{ fontSize:48, marginBottom:16 }}>⚡</div><div style={{ fontSize:18, opacity:0.7 }}>Cargando tus hábitos...</div></div>
      </div>
    );
  }

  const today = getTodayStr();
  const selectedLogs = data.logs[selectedDay] || {};
  const completedSelected = data.habits.filter(h => selectedLogs[h.id]).length;
  const isToday = selectedDay === today;
  const generalStreak = getGeneralStreak();

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)", fontFamily:"'Segoe UI', system-ui, sans-serif", color:"#fff", maxWidth:480, margin:"0 auto" }}>

      {toast && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:toast.color, color:"#fff", padding:"12px 24px", borderRadius:50, fontWeight:700, fontSize:14, zIndex:1000, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", whiteSpace:"nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding:"24px 20px 16px", background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, background:"linear-gradient(90deg, #FF6B6B, #FECA57, #06D6A0, #48CAE4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>MisHábitos ✨</div>
            <div style={{ fontSize:12, opacity:0.5, marginTop:2 }}>
              {tab === TAB.HOY ? `${isToday ? "Hoy · " : ""}${DIAS_SEMANA_FULL[getDayOfWeek(selectedDay)]} ${formatDate(selectedDay)}` : formatDate(today)}
            </div>
          </div>
          {tab === TAB.HOY && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:28, fontWeight:900, color:completedSelected === data.habits.length ? "#06D6A0" : "#FECA57" }}>{completedSelected}/{data.habits.length}</div>
              <div style={{ fontSize:11, opacity:0.5 }}>{isToday ? "hoy" : "ese día"}</div>
            </div>
          )}
          {tab !== TAB.HOY && generalStreak > 0 && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:22, fontWeight:900, color:"#FECA57" }}>🔥 {generalStreak}</div>
              <div style={{ fontSize:11, opacity:0.5 }}>días seguidos</div>
            </div>
          )}
        </div>
        {tab === TAB.HOY && (
          <>
            <div style={{ marginTop:12, height:6, background:"rgba(255,255,255,0.1)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${data.habits.length > 0 ? (completedSelected/data.habits.length)*100 : 0}%`, background:"linear-gradient(90deg, #FF6B6B, #FECA57, #06D6A0)", borderRadius:3, transition:"width 0.5s ease" }} />
            </div>
            {generalStreak > 0 && (
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:14 }}>🔥</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#FECA57" }}>{generalStreak} {generalStreak === 1 ? "día seguido" : "días seguidos"} con al menos 1 hábito</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <div style={{ display:"flex", padding:"8px 12px", gap:4, background:"rgba(255,255,255,0.02)" }}>
        {[{key:TAB.HOY,label:"Registro",icon:"✅"},{key:TAB.ESTADISTICAS,label:"Stats",icon:"📊"},{key:TAB.IA,label:"IA Coach",icon:"🤖"},{key:TAB.HABITOS,label:"Hábitos",icon:"⚙️"}].map(({key,label,icon}) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex:1, padding:"8px 4px", border:"none", borderRadius:10, cursor:"pointer", fontSize:11, fontWeight:700, transition:"all 0.2s", background:tab===key ? "linear-gradient(135deg, #FF6B6B, #FECA57)" : "rgba(255,255,255,0.06)", color:tab===key ? "#fff" : "rgba(255,255,255,0.5)" }}>
            <div style={{ fontSize:16 }}>{icon}</div><div>{label}</div>
          </button>
        ))}
      </div>

      <div style={{ padding:"16px 16px 100px" }}>

        {/* REGISTRO */}
        {tab === TAB.HOY && (
          <div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:11, opacity:0.5, fontWeight:700 }}>SELECCIONÁ EL DÍA</div>
                {daysBack < 30 && (
                  <button onClick={() => setDaysBack(d => Math.min(d+7, 30))} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontWeight:600 }}>← Ver más</button>
                )}
              </div>
              <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
                {getLastNDays(daysBack).map(dateStr => {
                  const dow = getDayOfWeek(dateStr);
                  const logs = data.logs[dateStr] || {};
                  const done = data.habits.filter(h => logs[h.id]).length;
                  const isSelected = selectedDay === dateStr;
                  const isTod = dateStr === today;
                  return (
                    <div key={dateStr} onClick={() => setSelectedDay(dateStr)} style={{ flexShrink:0, width:46, padding:"8px 4px", borderRadius:14, border:`2px solid ${isSelected ? "#FECA57" : "rgba(255,255,255,0.1)"}`, background:isSelected ? "rgba(254,202,87,0.15)" : "rgba(255,255,255,0.04)", cursor:"pointer", textAlign:"center", transition:"all 0.2s" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:isSelected ? "#FECA57" : "rgba(255,255,255,0.5)", marginBottom:2 }}>{isTod ? "HOY" : DIAS_SEMANA[dow]}</div>
                      <div style={{ fontSize:16, fontWeight:900, color:isSelected ? "#fff" : "rgba(255,255,255,0.7)" }}>{dateStr.split("-")[2]}</div>
                      <div style={{ fontSize:9, marginTop:3, color:done > 0 ? "#06D6A0" : "rgba(255,255,255,0.3)" }}>{done > 0 ? `${done}✓` : "—"}</div>
                    </div>
                  );
                })}
              </div>
              {!isToday && (
                <div style={{ marginTop:8, padding:"6px 12px", borderRadius:10, background:"rgba(254,202,87,0.1)", border:"1px solid rgba(254,202,87,0.3)", fontSize:12, color:"#FECA57", fontWeight:600 }}>
                  ✏️ Editando {DIAS_SEMANA_FULL[getDayOfWeek(selectedDay)]} {formatDate(selectedDay)}
                </div>
              )}
            </div>

            {completedSelected === data.habits.length && data.habits.length > 0 && (
              <div style={{ background:"linear-gradient(135deg, #06D6A0, #48CAE4)", borderRadius:16, padding:"16px 20px", marginBottom:16, textAlign:"center" }}>
                <div style={{ fontSize:32 }}>🏆</div>
                <div style={{ fontWeight:800, fontSize:16 }}>¡Todos los hábitos completados!</div>
                <div style={{ fontSize:13, opacity:0.8, marginTop:4 }}>{isToday ? "Sos una máquina hoy 💪" : `Gran ${DIAS_SEMANA_FULL[getDayOfWeek(selectedDay)].toLowerCase()} 💪`}</div>
              </div>
            )}

            {data.habits.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", opacity:0.5 }}>
                <div style={{ fontSize:48 }}>🌱</div>
                <div style={{ marginTop:12 }}>No tenés hábitos aún. ¡Creá uno en la pestaña Hábitos!</div>
              </div>
            ) : data.habits.map(habit => {
              const color = COLORS[habit.colorIdx % COLORS.length];
              const done = !!selectedLogs[habit.id];
              const streak = getHabitStreak(habit.id);
              const monthStats = getMonthStats(habit.id, getMonthStr());
              return (
                <div key={habit.id} onClick={() => toggleHabit(habit.id, selectedDay)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", marginBottom:10, borderRadius:16, background:done ? `${color.bg}22` : "rgba(255,255,255,0.04)", border:`2px solid ${done ? color.bg : "rgba(255,255,255,0.08)"}`, cursor:"pointer", transition:"all 0.2s", transform:done ? "scale(1.01)" : "scale(1)" }}>
                  <div style={{ width:28, height:28, borderRadius:8, border:`3px solid ${color.bg}`, background:done ? color.bg : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
                    {done && <span style={{ fontSize:16 }}>✓</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:done ? color.bg : "#fff" }}>{habit.name}</div>
                    <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap", alignItems:"center" }}>
                      {streak > 0 && (
                        <div style={{ fontSize:11, fontWeight:700, color:"#FECA57" }}>🔥 {streak} {streak === 1 ? "día" : "días"} seguido{streak > 1 ? "s" : ""}</div>
                      )}
                      {monthStats.goal && !monthStats.exceeded && (
                        <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)" }}>· faltan {monthStats.goal - monthStats.count} para la meta</div>
                      )}
                      {monthStats.exceeded && (
                        <div style={{ fontSize:11, fontWeight:700, color:color.bg }}>· meta superada 🔥 (+{monthStats.count - monthStats.goal})</div>
                      )}
                      {!monthStats.goal && monthStats.count > 0 && (
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontWeight:600 }}>· {monthStats.count} este mes</div>
                      )}
                    </div>
                  </div>
                  <div style={{ width:12, height:12, borderRadius:"50%", background:color.bg, opacity:done ? 1 : 0.3, flexShrink:0 }} />
                </div>
              );
            })}
          </div>
        )}

        {/* ESTADÍSTICAS */}
        {tab === TAB.ESTADISTICAS && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
              {getAllMonths().map(mo => (
                <button key={mo} onClick={() => setSelectedMonth(mo)} style={{ flexShrink:0, padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:selectedMonth===mo ? "linear-gradient(135deg, #FF6B6B, #FECA57)" : "rgba(255,255,255,0.08)", color:"#fff" }}>
                  {formatMonth(mo)}
                </button>
              ))}
            </div>

            <div style={{ fontSize:12, opacity:0.5, fontWeight:700, marginBottom:12 }}>PATRONES POR DÍA DE SEMANA</div>
            {data.habits.map(habit => {
              const color = COLORS[habit.colorIdx % COLORS.length];
              const { counts } = getDayOfWeekStats(habit.id);
              const maxCount = Math.max(...counts, 1);
              const totalDone = counts.reduce((a,b) => a+b, 0);
              const bestDay = counts.indexOf(Math.max(...counts));
              return (
                <div key={habit.id} style={{ marginBottom:16, padding:"14px 16px", borderRadius:16, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:color.bg }}>{habit.name}</div>
                    {totalDone > 0 && <div style={{ fontSize:11, opacity:0.5 }}>Mejor día: <span style={{ color:color.bg, fontWeight:700 }}>{DIAS_SEMANA_FULL[bestDay]}</span></div>}
                  </div>
                  <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:80 }}>
                    {DIAS_SEMANA.map((dia, i) => {
                      const count = counts[i];
                      const barH = Math.round((count/maxCount)*52);
                      const isWeekend = i === 0 || i === 6;
                      const isBest = i === bestDay && count > 0;
                      return (
                        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                          <div style={{ fontSize:9, fontWeight:800, color:isBest ? "#FECA57" : color.bg, opacity:count > 0 ? 1 : 0, minHeight:12 }}>{count > 0 ? count : ""}</div>
                          <div style={{ width:"100%", height:52, display:"flex", alignItems:"flex-end" }}>
                            <div style={{ width:"100%", height:Math.max(barH, count > 0 ? 4 : 2), background:isBest ? "#FECA57" : count > 0 ? color.bg : "rgba(255,255,255,0.08)", borderRadius:4, opacity:isWeekend && !isBest ? 0.65 : 1, transition:"height 0.4s ease" }} />
                          </div>
                          <div style={{ fontSize:9, fontWeight:700, color:isBest ? "#FECA57" : isWeekend ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.6)" }}>{dia}</div>
                        </div>
                      );
                    })}
                  </div>
                  {totalDone === 0 && <div style={{ fontSize:11, opacity:0.4, textAlign:"center", marginTop:4 }}>Sin datos aún</div>}
                </div>
              );
            })}

            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:12, opacity:0.5, fontWeight:700, marginBottom:12 }}>CALENDARIO — {formatMonth(selectedMonth)}</div>
              {data.habits.map(habit => {
                const color = COLORS[habit.colorIdx % COLORS.length];
                const [y,m] = selectedMonth.split("-").map(Number);
                const days = getDaysInMonth(y, m);
                const firstDow = new Date(y, m-1, 1).getDay();
                const todayStr = getTodayStr();
                const doneDays = Array.from({length:days}, (_,i) => {
                  const dateStr = `${selectedMonth}-${String(i+1).padStart(2,"0")}`;
                  return data.logs[dateStr]?.[habit.id] ? i+1 : null;
                }).filter(Boolean);
                const stats = getMonthStats(habit.id, selectedMonth);
                return (
                  <div key={habit.id} style={{ marginBottom:20, padding:"14px", borderRadius:16, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:color.bg }}>{habit.name}</div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        {stats.exceeded && <span style={{ fontSize:12 }}>🔥</span>}
                        <div style={{ fontSize:12, fontWeight:800, color:stats.exceeded ? "#FECA57" : color.bg }}>{doneDays.length}{stats.goal ? `/${stats.goal}` : ""} días</div>
                      </div>
                    </div>
                    {doneDays.length > 0 && (
                      <div style={{ marginBottom:10, padding:"8px 10px", borderRadius:10, background:`${color.bg}15`, border:`1px solid ${color.bg}33` }}>
                        <div style={{ fontSize:10, opacity:0.6, fontWeight:700, marginBottom:4 }}>DÍAS COMPLETADOS</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {doneDays.map(d => {
                            const dateStr = `${selectedMonth}-${String(d).padStart(2,"0")}`;
                            const dow = getDayOfWeek(dateStr);
                            return <div key={d} style={{ padding:"2px 8px", borderRadius:20, background:color.bg, fontSize:11, fontWeight:700, color:"#fff" }}>{DIAS_SEMANA[dow]} {d}</div>;
                          })}
                        </div>
                      </div>
                    )}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:2, marginBottom:4 }}>
                      {DIAS_SEMANA.map(d => <div key={d} style={{ fontSize:8, textAlign:"center", opacity:0.35, fontWeight:700, paddingBottom:2 }}>{d}</div>)}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:2 }}>
                      {Array.from({length:firstDow}, (_,i) => <div key={`e${i}`} />)}
                      {Array.from({length:days}, (_,i) => {
                        const dateStr = `${selectedMonth}-${String(i+1).padStart(2,"0")}`;
                        const done = data.logs[dateStr]?.[habit.id];
                        const dow = getDayOfWeek(dateStr);
                        const isWeekend = dow === 0 || dow === 6;
                        const isToday2 = dateStr === todayStr;
                        const isFuture = dateStr > todayStr;
                        return (
                          <div key={i} style={{ aspectRatio:"1", borderRadius:5, background:done ? color.bg : isFuture ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:done ? "#fff" : isFuture ? "rgba(255,255,255,0.15)" : isWeekend ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.4)", fontWeight:700, outline:isToday2 ? `2px solid ${color.bg}` : "none", outlineOffset:1, position:"relative" }}>
                            {i+1}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"flex", gap:12, marginTop:8, fontSize:10, opacity:0.5 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:10, height:10, borderRadius:2, background:color.bg }} /><span>Completado</span></div>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:10, height:10, borderRadius:2, background:"rgba(255,255,255,0.07)" }} /><span>No completado</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* IA COACH */}
        {tab === TAB.IA && (
          <div>
            <div style={{ background:"linear-gradient(135deg, #A29BFE22, #FD79A822)", border:"1px solid #A29BFE44", borderRadius:16, padding:"14px 16px", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#A29BFE" }}>🤖 HábitosAI</div>
              <div style={{ fontSize:12, opacity:0.7, marginTop:4 }}>Tengo acceso a tu historial completo, incluyendo patrones por día de semana.</div>
            </div>
            {aiHistory.length === 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, opacity:0.5, marginBottom:8, fontWeight:600 }}>PREGUNTAS SUGERIDAS</div>
                {["¿Cómo estoy yendo este mes?","¿Qué días de la semana fallo más?","¿Qué hábito necesita más atención?","Dame un consejo para mejorar"].map(q => (
                  <button key={q} onClick={() => askAI(q)} style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", marginBottom:8, borderRadius:12, border:"1px solid rgba(162,155,254,0.3)", background:"rgba(162,155,254,0.08)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500 }}>💬 {q}</button>
                ))}
              </div>
            )}
            <div style={{ marginBottom:16 }}>
              {aiHistory.map((msg, i) => (
                <div key={i} style={{ marginBottom:12, display:"flex", justifyContent:msg.role==="user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth:"85%", padding:"12px 16px", borderRadius:msg.role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background:msg.role==="user" ? "linear-gradient(135deg, #FF6B6B, #FECA57)" : "rgba(255,255,255,0.08)", fontSize:13, lineHeight:1.5, whiteSpace:"pre-wrap" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ display:"flex", gap:6, padding:"12px 16px", background:"rgba(255,255,255,0.08)", borderRadius:"18px 18px 18px 4px", width:"fit-content" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#A29BFE", animation:`bounce 1s ${i*0.2}s infinite` }} />)}
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={aiMsg} onChange={e => setAiMsg(e.target.value)} onKeyDown={e => e.key==="Enter" && !aiLoading && askAI(aiMsg)} placeholder="Preguntale algo a tu coach..." style={{ flex:1, padding:"12px 16px", borderRadius:24, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:14, outline:"none" }} />
              <button onClick={() => !aiLoading && askAI(aiMsg)} disabled={aiLoading || !aiMsg.trim()} style={{ padding:"12px 20px", borderRadius:24, border:"none", background:aiMsg.trim() ? "linear-gradient(135deg, #FF6B6B, #FECA57)" : "rgba(255,255,255,0.1)", color:"#fff", cursor:aiMsg.trim() ? "pointer" : "default", fontWeight:700, fontSize:14 }}>➤</button>
            </div>
            {aiHistory.length > 0 && (
              <button onClick={() => setAiHistory([])} style={{ marginTop:12, padding:"8px 16px", borderRadius:20, border:"1px solid rgba(255,255,255,0.15)", background:"transparent", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:12, display:"block", margin:"12px auto 0" }}>Nueva conversación</button>
            )}
          </div>
        )}

        {/* HÁBITOS */}
        {tab === TAB.HABITOS && (
          <div>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ width:"100%", padding:"14px", borderRadius:16, border:"2px dashed rgba(255,255,255,0.2)", background:showAddForm ? "rgba(255,255,255,0.08)" : "transparent", color:"#fff", cursor:"pointer", fontSize:15, fontWeight:700, marginBottom:16 }}>
              {showAddForm ? "✕ Cancelar" : "+ Nuevo hábito"}
            </button>
            {showAddForm && (
              <div style={{ padding:"16px", borderRadius:16, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", marginBottom:16 }}>
                <input value={newHabitName} onChange={e => setNewHabitName(e.target.value)} onKeyDown={e => e.key==="Enter" && addHabit()} placeholder="Nombre del hábito..." style={{ width:"100%", padding:"12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:12 }} />
                <div style={{ fontSize:12, opacity:0.5, marginBottom:8, fontWeight:600 }}>COLOR</div>
                <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                  {COLORS.map((c,i) => <div key={i} onClick={() => setNewHabitColor(i)} style={{ width:32, height:32, borderRadius:8, background:c.bg, cursor:"pointer", border:newHabitColor===i ? "3px solid #fff" : "3px solid transparent" }} />)}
                </div>
                <div style={{ fontSize:12, opacity:0.5, marginBottom:8, fontWeight:600 }}>META MENSUAL (días)</div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <button onClick={() => setNewHabitGoal(g => Math.max(1,g-1))} style={{ width:34, height:34, borderRadius:10, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.08)", color:"#fff", cursor:"pointer", fontSize:18, fontWeight:700 }}>−</button>
                  <div style={{ flex:1, textAlign:"center", fontSize:24, fontWeight:900, color:COLORS[newHabitColor].bg }}>{newHabitGoal}</div>
                  <button onClick={() => setNewHabitGoal(g => Math.min(31,g+1))} style={{ width:34, height:34, borderRadius:10, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.08)", color:"#fff", cursor:"pointer", fontSize:18, fontWeight:700 }}>+</button>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                  {[5,10,15,20,25,28,31].map(n => (
                    <button key={n} onClick={() => setNewHabitGoal(n)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${newHabitGoal===n ? COLORS[newHabitColor].bg : "rgba(255,255,255,0.15)"}`, background:newHabitGoal===n ? `${COLORS[newHabitColor].bg}33` : "transparent", color:newHabitGoal===n ? COLORS[newHabitColor].bg : "rgba(255,255,255,0.5)", cursor:"pointer", fontSize:11, fontWeight:700 }}>{n}d</button>
                  ))}
                </div>
                <button onClick={addHabit} disabled={!newHabitName.trim()} style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background:newHabitName.trim() ? "linear-gradient(135deg, #06D6A0, #48CAE4)" : "rgba(255,255,255,0.1)", color:"#fff", cursor:newHabitName.trim() ? "pointer" : "default", fontWeight:700, fontSize:14 }}>Crear hábito 🚀</button>
              </div>
            )}
            <div style={{ fontSize:12, opacity:0.5, marginBottom:12, fontWeight:600 }}>TUS HÁBITOS ({data.habits.length})</div>
            {data.habits.map(habit => {
              const color = COLORS[habit.colorIdx % COLORS.length];
              const stats = getMonthStats(habit.id, getMonthStr());
              const isEditingThisGoal = editingGoal === habit.id;
              const exceeded = stats.exceeded;
              return (
                <div key={habit.id} style={{ marginBottom:10, borderRadius:16, background:"rgba(255,255,255,0.04)", border:`1px solid ${exceeded ? color.bg+"66" : "rgba(255,255,255,0.08)"}`, overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px" }}>
                    <div style={{ width:16, height:16, borderRadius:4, background:color.bg, flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{habit.name}</div>
                      <div style={{ fontSize:11, opacity:0.5, marginTop:2 }}>{stats.count} días este mes{stats.goal ? ` · meta: ${stats.goal}` : " · sin meta"}{exceeded ? " 🔥" : ""}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                      <button onClick={() => moveHabit(habit.id,"up")} style={{ width:26, height:26, borderRadius:6, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>▲</button>
                      <button onClick={() => moveHabit(habit.id,"down")} style={{ width:26, height:26, borderRadius:6, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>▼</button>
                    </div>
                    <button onClick={() => setEditingGoal(isEditingThisGoal ? null : habit.id)} style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${color.bg}55`, background:`${color.bg}18`, color:color.bg, cursor:"pointer", fontSize:11, fontWeight:700 }}>🎯 Meta</button>
                    <button onClick={() => deleteHabit(habit.id)} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.1)", color:"#FF6B6B", cursor:"pointer", fontSize:11, fontWeight:700 }}>🗑</button>
                  </div>
                  {isEditingThisGoal && (
                    <div style={{ padding:"12px 16px 14px", borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.03)" }}>
                      <div style={{ fontSize:12, opacity:0.6, marginBottom:10, fontWeight:600 }}>META MENSUAL DE DÍAS</div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                        <button onClick={() => { updateHabitGoal(habit.id, Math.max(1,(habit.monthlyGoal||1)-1)); setEditingGoal(habit.id); }} style={{ width:36, height:36, borderRadius:10, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.08)", color:"#fff", cursor:"pointer", fontSize:20, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                        <div style={{ flex:1, textAlign:"center" }}>
                          <div style={{ fontSize:32, fontWeight:900, color:color.bg }}>{habit.monthlyGoal || "—"}</div>
                          <div style={{ fontSize:11, opacity:0.4 }}>días por mes</div>
                        </div>
                        <button onClick={() => { updateHabitGoal(habit.id, Math.min(31,(habit.monthlyGoal||0)+1)); setEditingGoal(habit.id); }} style={{ width:36, height:36, borderRadius:10, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.08)", color:"#fff", cursor:"pointer", fontSize:20, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                      </div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {[5,10,15,20,25,28,31].map(n => (
                          <button key={n} onClick={() => updateHabitGoal(habit.id, n)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${habit.monthlyGoal===n ? color.bg : "rgba(255,255,255,0.15)"}`, background:habit.monthlyGoal===n ? `${color.bg}33` : "transparent", color:habit.monthlyGoal===n ? color.bg : "rgba(255,255,255,0.5)", cursor:"pointer", fontSize:12, fontWeight:700 }}>{n}d</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        * { box-sizing:border-box; }
        input::placeholder { color:rgba(255,255,255,0.3); }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:2px; }
      `}</style>
    </div>
  );
}
