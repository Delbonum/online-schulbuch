import { useAuth } from "../auth/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [editData, setEditData] = useState({ username: "", password: "", progress: {} });
  const [showResetConfirm, setShowResetConfirm] = useState(null);
  const [selectedStatsUser, setSelectedStatsUser] = useState(null);
  const [statsData, setStatsData] = useState({});
  const [showDetails, setShowDetails] = useState(null);
  const [currentDetail, setCurrentDetail] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showGlobalStats, setShowGlobalStats] = useState(false);
  const [globalStatsData, setGlobalStatsData] = useState(null);

  useEffect(() => {
    if (user && user.role !== "teacher") {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === "teacher") {
      fetch(`http://localhost:3001/students?teacher=${user.username}`)
        .then((res) => res.json())
        .then((data) => setStudents(data))
        .catch((err) => console.error("Fehler beim Laden der Schülerdaten:", err));
    }
  }, [user]);

  const deleteStudent = async (username) => {
    const res = await fetch(`http://localhost:3001/students/${username}`, { method: "DELETE" });
    if (res.ok) {
      setStudents((prev) => prev.filter((s) => s.username !== username));
      setShowDeleteConfirm(null);
    }
  };

    const updateStudent = async () => {
      const body = {
        username: editData.username,
        progress: editData.progress
      };

      // Nur neues Passwort senden, wenn eins eingegeben wurde
      if (editData.password.trim()) {
        body.password = editData.password;
      }

      const res = await fetch(`http://localhost:3001/students/${editData.originalUsername}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const updated = await res.json();
        setStudents((prev) =>
          prev.map((s) =>
            s.username === editData.originalUsername
              ? { username: editData.username, progress: editData.progress }
              : s
          )
        );
        setShowEditForm(null);
      }
    };

  const getEntryClass = (entry) => {
    if (entry.manual === "freigeschaltet") return "text-green-600 italic";
    if (entry.manual === "gesperrt") return "text-red-600 italic";
    if (entry.score === 100) return "text-green-600 font-bold";
    return entry.manual ? "text-gray-600 italic" : "";
  };

    const globalStatsRef = useRef();
    const statsModalRef = useRef();

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showGlobalStats && globalStatsRef.current && !globalStatsRef.current.contains(event.target)) {
          setShowGlobalStats(false);
          setGlobalStatsData(null);
        }
        if (selectedStatsUser && statsModalRef.current && !statsModalRef.current.contains(event.target)) {
          setSelectedStatsUser(null);
          setStatsData({});
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showGlobalStats, selectedStatsUser]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 heading-style">Lehrer/-innen-Dashboard</h1>

      <table className="table-auto border border-white/30 w-full text-sm text-style">
        <thead>
          <tr>
            <th className="border border-white/70 px-2 py-1">Benutzername</th>
            <th className="border border-white/70 px-2 py-1">Level 1</th>
            <th className="border border-white/70 px-2 py-1">Level 2</th>
            <th className="border border-white/70 px-2 py-1">Level 3</th>
            <th className="border border-white/70 px-2 py-1">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr key={i}>
              <td className="border border-white/40 px-2 py-1 cursor-pointer text-blue-300 hover:text-white underline"
                    onClick={async () => {
                      setSelectedStatsUser(s.username);
                      const res = await fetch(`http://localhost:3001/progress/${s.username}/history`);
                      const data = await res.json();
                      setStatsData(data);
                    }}>
                  {s.username}
              </td>

              <td className="border border-white/40 px-2 py-1 text-center">{s.progress.level1Passed ? "✅" : "❌"}</td>
              <td className="border border-white/40 px-2 py-1 text-center">{s.progress.level2Passed ? "✅" : "❌"}</td>
              <td className="border border-white/40 px-2 py-1 text-center">{s.progress.level3Passed ? "✅" : "❌"}</td>
              <td className="border border-white/40 px-2 py-1 text-center">
                <button onClick={() => {
                  setEditData({
                      originalUsername: s.username,
                      username: s.username,
                      password: "",
                      progress: { ...s.progress }
                    });
                  setShowEditForm(s.username);
                }}>✏️</button>
                <button onClick={() => setShowDeleteConfirm(s.username)} className="ml-2">🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    <div className="mt-2 flex justify-end gap-2">
      <button
        onClick={async () => {
          const res = await fetch(`http://localhost:3001/teachers/${user.username}/statistics`);
          const data = await res.json();
          setGlobalStatsData(data);
          setShowGlobalStats(true);
        }}
        className="text-sm px-3 py-1 border border-white text-white rounded hover:bg-white hover:text-black transition"
      >
        Globale Statistik
      </button>

      <button
        onClick={() => setShowAddForm(true)}
        className="text-sm px-3 py-1 border border-white text-white rounded hover:bg-white hover:text-black transition"
      >
        + Schüler/-in hinzufügen
      </button>
    </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded shadow-lg w-80">
            <h2 className="text-lg font-bold mb-4">Neue/r Schüler/-in</h2>

            <input type="text" placeholder="Benutzername" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="input-style w-full mb-2" />
            <input type="password" placeholder="Passwort" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="input-style w-full mb-4" />

            <div className="flex justify-between">
              <button onClick={() => { setShowAddForm(false); setNewUser({ username: "", password: "" }); }} className="text-sm px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-gray-100">Abbrechen</button>
              <button onClick={async () => {
                const res = await fetch("http://localhost:3001/students", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...newUser, teacher: user.username })
                });
                if (res.ok) {
                  const { student } = await res.json();
                  setStudents((prev) => [...prev, student]);
                  setShowAddForm(false);
                  setNewUser({ username: "", password: "" });
                } else {
                  alert("Fehler beim Anlegen – Name evtl. schon vergeben?");
                }
              }} className="text-sm px-3 py-1 border border-blue-600 text-blue-700 rounded hover:bg-blue-100">Schüler/-in anlegen</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded shadow-lg w-80">
            <p className="mb-4">Schüler/-in <strong>{showDeleteConfirm}</strong> wirklich löschen?</p>
            <div className="flex justify-between">
              <button onClick={() => setShowDeleteConfirm(null)} className="text-sm px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-gray-100">Abbrechen</button>
              <button onClick={() => deleteStudent(showDeleteConfirm)} className="text-sm px-3 py-1 border border-red-600 text-red-700 rounded hover:bg-red-100">Löschen</button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Schüler/-in bearbeiten</h2>

            <input
              type="text"
              value={editData.username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              className="input-style w-full mb-2"
            />
            <input
              type="password"
              placeholder="Neues Passwort"
              value={editData.password}
              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
              className="input-style w-full mb-4"
            />

            <div className="mb-2">
              <label className="block font-semibold mb-1">Fortschritt:</label>
              {["level1Passed", "level2Passed", "level3Passed"].map((key) => (
                <label key={key} className="block text-sm">
                  <input
                    type="checkbox"
                    checked={!!editData.progress[key]}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        progress: {
                          ...editData.progress,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  {key}
                </label>
              ))}
            </div>

            <div className="mt-4 mb-6">
              <button
                onClick={() => setShowResetConfirm(editData.originalUsername)}
                className="text-sm px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-red-100"
              >
                Fortschritt und Statistik zurücksetzen
              </button>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setShowEditForm(null)} className="text-sm px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-gray-100">Abbrechen</button>
              <button onClick={updateStudent} className="text-sm px-3 py-1 border border-green-600 text-green-700 rounded hover:bg-green-100">Speichern</button>
            </div>
          </div>
        </div>
      )}

    {selectedStatsUser && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <div ref={statsModalRef} className="bg-white text-black p-6 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          {showDetails ? (
            <>
              <h2 className="text-lg font-bold mb-4">Details für {showDetails}</h2>
              {selectedAttempt && (
                  <p className="text-sm text-gray-600 mb-2">
                      {new Date(selectedAttempt.timestamp).toLocaleString()} – {selectedAttempt.score}% richtig
                  </p>
              )}
              <ul className="text-sm space-y-1">
                {currentDetail.map((d, i) => (
                  <li key={i}>
                    Aufgabe {d.task}: {d.correct ? "✔️ richtig" : "❌ falsch"}
                    {typeof d.answer === "string" && (
                      <span className="ml-2 text-gray-600">Antwort: "{d.answer}"</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-sm px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-gray-100"
                >
                  Zurück
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-4">Statistik für: {selectedStatsUser}</h2>

              {Object.entries(statsData).map(([levelKey, entries]) => (
                <div key={levelKey} className="mb-4">
                  <h3 className="font-semibold mb-2">{levelKey}</h3>
                  <ul className="text-sm space-y-1">
                    {entries.map((e, i) => {
                      const time = new Date(e.timestamp).toLocaleString();
                      const showInfo = !e.manual && e.details;
                      return (
                        <li key={i} className={getEntryClass(e)}>
                          {time} – {e.manual ? `manuell ${e.manual}` : `${e.score}% richtig`}
                          {showInfo && (
                              <>
                              <span className="text-gray-400"> | </span>
                            <button
                              onClick={() => {
                                setCurrentDetail(e.details);
                                setSelectedAttempt(e);
                                setShowDetails(levelKey + "#" + i);
                              }}
                              className="ml-2 text-blue-600 underline text-xs"
                            >
                              Info
                            </button>
                                </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedStatsUser(null);
                    setStatsData({});
                  }}
                  className="text-sm px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-gray-100"
                >
                  Schließen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}

    {showResetConfirm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white text-black p-6 rounded shadow-lg w-80">
          <p className="mb-4">
            Fortschritt und Statistik für <strong>{showResetConfirm}</strong> wirklich zurücksetzen?
          </p>
          <div className="flex justify-between">
            <button
              onClick={() => setShowResetConfirm(null)}
              className="text-sm px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-gray-100"
            >
              Abbrechen
            </button>
            <button
              onClick={async () => {
                const res = await fetch(`http://localhost:3001/students/${showResetConfirm}/reset`, {
                  method: "DELETE"
                });
                if (res.ok) {
                  setStudents((prev) =>
                    prev.map((s) =>
                      s.username === showResetConfirm ? { ...s, progress: {} } : s
                    )
                  );
                  if (editData.originalUsername === showResetConfirm) {
                    setEditData(ed => ({ ...ed, progress: {} }));
                  }
                  setShowResetConfirm(null);
                } else {
                  alert("Fehler beim Zurücksetzen.");
                }
              }}
              className="text-sm px-3 py-1 border border-red-600 text-red-700 rounded hover:bg-red-100"
            >
              Zurücksetzen
            </button>
          </div>
        </div>
      </div>
    )}

    {showGlobalStats && globalStatsData && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <div ref={globalStatsRef} className="bg-white text-black p-6 rounded shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Globale Statistik</h2>

            {/* Kuchendiagramm */}
            <h3 className="font-semibold mt-4 mb-2">Bestehensquoten</h3>
            <PieChart width={500} height={300}>
              <Pie
                data={Object.entries(globalStatsData.completionGroups)
                  .filter(([, value]) => value > 0)
                  .map(([name, value], index, arr) => ({
                    name,
                    value,
                    fill: `hsl(${(index * 360) / arr.length}, 70%, 60%)`, // dynamische Farbe
                  }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const { name, value } = payload[0].payload;
                    const total = Object.values(globalStatsData.completionGroups)
                      .reduce((sum, v) => sum + (v > 0 ? v : 0), 0);
                    const percent = total > 0 ? (value / total * 100).toFixed(1) : "0";
                    return (
                      <div style={{ fontSize: "0.75rem", background: "white", padding: "0.5rem", borderRadius: "0.25rem" }}>
                        <strong>{name}</strong>: {value} ({percent}%)
                      </div>
                    );
                  }}
                />
              </Pie>
              <Legend />
            </PieChart>

          {/* Lernfortschritt */}
          <h3 className="font-semibold mt-6 mb-2">Lernfortschritt pro Level</h3>
          <BarChart width={500} height={250} data={[
            { level: "Level 1", count: globalStatsData.progressSummary.level1 },
            { level: "Level 2", count: globalStatsData.progressSummary.level2 },
            { level: "Level 3", count: globalStatsData.progressSummary.level3 }
          ]}>
            <XAxis dataKey="level" />
            <YAxis domain={[0, students.length]} />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload[0]) return null;
                const { name, value } = payload[0];
                const total = students.length;
                const percent = total > 0 ? (value / total * 100).toFixed(1) : "0";
                return (
                  <div style={{ fontSize: "0.75rem", background: "white", padding: "0.5rem", borderRadius: "0.25rem" }}>
                    <strong>Erfolgreich absolviert:</strong> {value}<br></br><strong>Anteil an allen SuS:</strong> {percent}%
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              name="Anzahl"
              isAnimationActive={false}
              shape={(props) => {
                const total = students.length;
                if (total === 0 || props.payload.count == null) return null;

                const ratio = props.payload.count / total;
                const hue = ratio * 120;
                const fillColor = `hsl(${hue}, 60%, 60%)`;

                return <rect {...props} fill={fillColor} />;
              }}
            />
          </BarChart>

          {/* Durchschnittlicher Score */}
          <h3 className="font-semibold mt-6 mb-2">Durchschnittlicher Score pro Level</h3>
            <BarChart layout="vertical" width={500} height={250} data={[
              { level: "Level 1", score: globalStatsData.averageScore.level1 },
              { level: "Level 2", score: globalStatsData.averageScore.level2 },
              { level: "Level 3", score: globalStatsData.averageScore.level3 }
            ]}>
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="level" />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const { name, value } = payload[0];
                    return (
                      <div style={{ fontSize: "0.75rem", background: "white", padding: "0.5rem", borderRadius: "0.25rem" }}>
                        <strong>{name}</strong>: {value}%
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="score"
                  name="Durchschnittlicher Score"
                  isAnimationActive={false}
                  shape={(props) => {
                    if (props.payload.score === null) return null;

                    const hue = (props.payload.score / 100) * 120;
                    const fillColor = `hsl(${hue}, 60%, 60%)`;

                    return <rect {...props} fill={fillColor} />;
                  }}
                />
            </BarChart>

          {/* Aufgaben-Auswertung */}
            {["level1", "level2", "level3"].map((levelKey) => {
              const taskData = Object.entries(globalStatsData.taskStats[levelKey] || {}).map(([task, values]) => ({
                task,
                correct: values.correct,
                wrong: values.wrong
              }));

              return (
                <div key={levelKey}>
                  <h3 className="font-semibold mt-6 mb-2">Aufgaben-Auswertung: {levelKey}</h3>

                  {taskData.length === 0 ? (
                    <p className="text-sm text-gray-500">Keine Daten vorhanden</p>
                  ) : (
                    <BarChart width={600} height={300} data={taskData}>
                      <XAxis dataKey="task" />
                      <YAxis />
                        <Tooltip
                          content={({ payload }) => {
                            if (!payload || !payload.length) return null;
                            const total = payload.reduce((sum, p) => sum + p.value, 0);
                            return (
                              <div style={{ fontSize: "0.75rem", background: "white", padding: "0.5rem", borderRadius: "0.25rem" }}>
                                {payload.map((p) => (
                                  <div key={p.name}>
                                    <strong>{p.name}</strong>: {p.value} ({total > 0 ? (p.value / total * 100).toFixed(1) : "0"}%)
                                  </div>
                                ))}
                              </div>
                            );
                          }}
                        />
                      <Legend />
                      <Bar dataKey="correct" name="Korrekte Antworten" stackId="a" fill="#4CAF50" />
                      <Bar dataKey="wrong" name="Falsche Antworten" stackId="a" fill="#F44336" />
                    </BarChart>
                  )}
                </div>
              );
            })}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setShowGlobalStats(false);
                setGlobalStatsData(null);
              }}
              className="text-sm px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-gray-100"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}
