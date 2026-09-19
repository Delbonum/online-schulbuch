import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import { api } from "../lib/api";

const PIE_COLORS = ["#94a3b8", "#60a5fa", "#a78bfa", "#f472b6", "#fb923c", "#34d399"];

/** Rot (0 %) über Gelb bis Grün (100 %) */
const scoreColor = (ratio) => `hsl(${Math.round(ratio * 120)}, 60%, 50%)`;

function ChartSection({ title, children, empty }) {
  return (
    <section className="mt-6">
      <h3 className="font-semibold mb-2">{title}</h3>
      {empty ? <p className="text-sm text-gray-500">Noch keine Daten vorhanden.</p> : children}
    </section>
  );
}

export default function StatisticsDialog({ classes = [], initialClassId = "all", onClose }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [classId, setClassId] = useState(initialClassId);

  useEffect(() => {
    let active = true;
    setStats(null);
    setError(null);
    api
      .statistics(classId === "all" ? null : classId)
      .then((data) => active && setStats(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [classId]);

  const classFilter = classes.length > 0 && (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <label htmlFor="stats-class" className="text-sm font-medium">
        Auswertung für:
      </label>
      <select
        id="stats-class"
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        className="dialog-input w-auto"
      >
        <option value="all">Alle Schüler/-innen</option>
        {classes.map((klass) => (
          <option key={klass.id} value={klass.id}>
            {klass.name}
          </option>
        ))}
        <option value="none">Ohne Klasse</option>
      </select>
    </div>
  );

  const footer = (
    <button type="button" onClick={onClose} className="btn-dialog">
      Schließen
    </button>
  );

  if (!stats) {
    return (
      <Modal title="Statistik" onClose={onClose} footer={footer} size="xl">
        {classFilter}
        {error ? <p className="text-red-700">{error}</p> : <Spinner />}
      </Modal>
    );
  }

  const total = stats.studentCount;
  const completion = stats.completion.filter((group) => group.count > 0);
  const passedData = stats.levels.map((level) => ({
    level: `Level ${level}`,
    count: stats.passedCounts[level] ?? 0,
  }));
  const scoreData = stats.levels.map((level) => ({
    level: `Level ${level}`,
    score: stats.averageScores[level],
  }));

  return (
    <Modal title="Statistik" onClose={onClose} footer={footer} size="xl">
      {classFilter}
      <p className="text-sm text-gray-600">{total} Schüler/-innen · Durchschnittswerte über alle Prüfungsversuche</p>

      <ChartSection title="Bestehensquoten" empty={total === 0}>
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={completion} dataKey="count" nameKey="label" outerRadius={90} label>
                {completion.map((group, i) => (
                  <Cell key={group.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} (${((value / total) * 100).toFixed(0)} %)`, "Schüler/-innen"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      <ChartSection title="Bestanden pro Level" empty={total === 0}>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={passedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="level" />
              <YAxis allowDecimals={false} domain={[0, Math.max(1, total)]} />
              <Tooltip formatter={(value) => [`${value} von ${total}`, "Bestanden"]} />
              <Bar dataKey="count" name="Bestanden" isAnimationActive={false}>
                {passedData.map((entry) => (
                  <Cell key={entry.level} fill={scoreColor(total ? entry.count / total : 0)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      <ChartSection title="Durchschnittlicher Score pro Level" empty={scoreData.every((d) => d.score === null)}>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={scoreData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit=" %" />
              <YAxis type="category" dataKey="level" width={70} />
              <Tooltip formatter={(value) => [value === null ? "–" : `${value} %`, "Ø Score"]} />
              <Bar dataKey="score" name="Ø Score" isAnimationActive={false}>
                {scoreData.map((entry) => (
                  <Cell key={entry.level} fill={scoreColor((entry.score ?? 0) / 100)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {stats.levels.map((level) => {
        const tasks = Object.entries(stats.taskStats[level] ?? {}).map(([task, values]) => ({
          task: `Aufgabe ${task}`,
          ...values,
        }));
        return (
          <ChartSection key={level} title={`Aufgaben-Auswertung Level ${level}`} empty={tasks.length === 0}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={tasks}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="task" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" name="Richtig" stackId="a" fill="#16a34a" isAnimationActive={false} />
                  <Bar dataKey="wrong" name="Falsch" stackId="a" fill="#dc2626" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartSection>
        );
      })}
    </Modal>
  );
}
