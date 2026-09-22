import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import './styles.css';

const API = 'https://mental-stress-early-warning.onrender.com';

const behavioralSignalNames = [
  'audio_events',
  'activity_events',
  'wifi_events',
  'app_events',
  'dark_minutes',
  'charge_minutes',
  'conversation_events',
  'calls_events',
  'lock_sessions',
  'dark_sessions'
];

const behavioralSignalValues = {
  audio_events: 37105.80,
  activity_events: 8750.31,
  wifi_events: 6233.30,
  app_events: 770.07,
  dark_minutes: 549.34,
  charge_minutes: 303.04,
  conversation_events: 29.18,
  calls_events: 23.50,
  lock_sessions: 3.81,
  dark_sessions: 2.82
};

const pages = [
  ['overview', 'Overview'],
  ['participants', 'Participants'],
  ['assessment', 'Personal Assessment'],
  ['trends', 'Stress Trends'],
  ['warnings', 'Early Warning'],
  ['signals', 'Behavioral Signals']
];

/* ============================================================
   MODEL FEATURE NAMES
============================================================ */

const factorNames = {
  stress_roll3: 'Recent stress trend (3-day)',
  prior_stress_roll3: 'Previous stress trend (3-day)',
  stress_lag1: 'Previous day stress',
  prior_stress: 'Prior stress level',
  stress_lag2: 'Stress two days earlier',
  sleep_hour_mean: 'Average sleep duration',
  prior_stress_2: 'Stress two observations earlier',
  stress_lag3: 'Stress three days earlier',
  sleep_rate_mean: 'Sleep quality / rate',
  sleep_hour_max: 'Maximum sleep duration',
  sleep_rate_max: 'Highest sleep rate',
  exercise_walk_mean: 'Walking activity',
  exercise_exercise_mean: 'Exercise activity',
  behavior_anxious_mean: 'Anxious behavior',
  behavior_calm_mean: 'Calm behavior',
  activity_working_mean: 'Working activity',
  activity_relaxing_mean: 'Relaxing activity',
  mood_happy_mean: 'Positive mood',
  mood_sad_mean: 'Negative mood',
  events_negative_mean: 'Negative events',
  events_positive_mean: 'Positive events'
};

function humanFactor(name) {
  return (
    factorNames[name] ||
    String(name)
      .replaceAll('_', ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  );
}

/* ============================================================
   RISK
============================================================ */

function riskFromStress(value) {
  const n = Number(value);

  if (!Number.isFinite(n)) return 'Low';
  if (n >= 4) return 'Critical';
  if (n >= 3) return 'High';
  if (n >= 2) return 'Moderate';

  return 'Low';
}

function riskClass(risk) {
  return String(risk || 'Low').toLowerCase();
}

function RiskBadge({ risk }) {
  return (
    <span className={`risk-badge ${riskClass(risk)}`}>
      {risk || 'Low'}
    </span>
  );
}

/* ============================================================
   METRIC
============================================================ */

function Metric({ label, value, hint, icon }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">
        {icon || '•'}
      </div>

      <div className="metric-copy">
        <span>{label}</span>

        <strong>{value}</strong>

        {hint && <small>{hint}</small>}
      </div>
    </div>
  );
}

/* ============================================================
   FACTOR BARS
============================================================ */

function FactorBars({ factors, limit = 10 }) {
  const items = (factors || []).slice(0, limit);

  const max = Math.max(
    ...items.map(
      x => Number(x.importance) || 0
    ),
    0.0001
  );

  return (
    <div className="factor-list">

      {items.map((x, i) => (

        <div
          className="factor-row"
          key={x.feature || i}
        >

          <div className="factor-label-line">

            <span>
              {i + 1}. {humanFactor(x.feature)}
            </span>

            <b>
              {Number(x.importance).toFixed(4)}
            </b>

          </div>

          <div className="factor-track">

            <i
              style={{
                width: `${Math.max(
                  2,
                  (
                    (Number(x.importance) || 0) /
                    max
                  ) * 100
                )}%`
              }}
            />

          </div>

          <small>
            Relative predictive importance
          </small>

        </div>

      ))}

    </div>
  );
}

/* ============================================================
   APP
============================================================ */

function App() {

  const [page, setPage] = useState('overview');

  const [data, setData] = useState(null);

  const [participants, setParticipants] =
    useState([]);

  const [warnings, setWarnings] =
    useState([]);

  const [metrics, setMetrics] =
    useState(null);

  const [behavioral, setBehavioral] =
    useState([]);

  const [assessment, setAssessment] =
    useState(null);

  const [assessmentName, setAssessmentName] =
    useState('');

  const [selectedParticipant, setSelectedParticipant] =
    useState(null);

  const [error, setError] =
    useState('');


  /* ==========================================================
     LOAD API DATA
  ========================================================== */

  const load = async () => {

    try {

      setError('');

      const [
        dashboardResponse,
        participantResponse,
        warningResponse
      ] = await Promise.all([

        fetch(API + '/dashboard'),

        fetch(API + '/participants'),

        fetch(API + '/early-warning')

      ]);


      if (!dashboardResponse.ok) {

        throw new Error(
          'Dashboard request failed'
        );

      }


      if (!participantResponse.ok) {

        throw new Error(
          'Participants request failed'
        );

      }


      if (!warningResponse.ok) {

        throw new Error(
          'Early-warning request failed'
        );

      }


      const [
        dashboardData,
        participantData,
        warningData
      ] = await Promise.all([

        dashboardResponse.json(),

        participantResponse.json(),

        warningResponse.json()

      ]);


      setData(dashboardData);

      setParticipants(
        participantData
      );

      setWarnings(
        warningData
      );


      setBehavioral(
        behavioralSignalNames.map(
          name => ({
            name,
            value:
              behavioralSignalValues[name]
          })
        )
      );


    } catch (e) {

      setError(
        'The analytics API is not available. Keep the FastAPI terminal running on port 8000.'
      );

    }

  };


  useEffect(() => {

    load();

  }, []);


  /* ==========================================================
     PERSONAL ASSESSMENT
  ========================================================== */

  const submit = async e => {

    e.preventDefault();


    const form =
      new FormData(e.target);


    const name =
      String(
        form.get('name') || ''
      ).trim();


    setAssessmentName(name);

    setError('');


    const body = {

      age:
        Number(
          form.get('age')
        ),

      sleep_hours:
        Number(
          form.get('sleep_hours')
        ),

      work_study_hours:
        Number(
          form.get(
            'work_study_hours'
          )
        ),

      physical_activity_hours:
        Number(
          form.get(
            'physical_activity_hours'
          )
        ),

      screen_time_hours:
        Number(
          form.get(
            'screen_time_hours'
          )
        ),

      mood:
        Number(
          form.get('mood')
        ),

      anxiety:
        Number(
          form.get('anxiety')
        ),

      social_interaction:
        Number(
          form.get(
            'social_interaction'
          )
        ),

      workload:
        Number(
          form.get('workload')
        )

    };


    try {

      const response =
        await fetch(
          API + '/assessment',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(body)
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        const detail =
          typeof result.detail ===
          'string'
            ? result.detail
            : 'Assessment failed';


        throw new Error(detail);

      }


      setAssessment(result);


    } catch (err) {

      setAssessment(null);

      setError(
        err.message ||
        'Assessment could not be completed.'
      );

    }

  };


  /* ==========================================================
     PAGE TITLES
  ========================================================== */

  const title = {

    overview:
      'Mental Stress Dashboard',

    participants:
      'Participants',

    assessment:
      'Personal Stress Assessment',

    trends:
      'Stress Trends',

    warnings:
      'Early Warning Center',

    signals:
      'Behavioral Signals'

  }[page];


  /* ==========================================================
     RISK COUNTS
  ========================================================== */

  const riskCounts =
    useMemo(() => {

      const counts = {

        Low: 0,

        Moderate: 0,

        High: 0,

        Critical: 0

      };


      participants.forEach(
        p => {

          const risk =
            riskFromStress(
              p.avg_stress
            );

          counts[risk] += 1;

        }
      );


      return counts;

    }, [participants]);


  /* ==========================================================
     STRESS DISTRIBUTION
  ========================================================== */

  const stressDistribution =
    useMemo(

      () =>

        [1, 2, 3, 4, 5].map(
          level => ({

            level:
              `Level ${level}`,

            count:
              participants.filter(
                p =>
                  Math.round(
                    Number(
                      p.avg_stress
                    )
                  ) === level
              ).length

          })
        ),

      [participants]

    );


  const displayWarnings =
    warnings.slice(0, 30);


  const primaryFactor =
    (data?.top_factors || [])[0];


  /* ==========================================================
     RETURN
  ========================================================== */

  return (

    <div className="app">


      {/* ======================================================
         SIDEBAR
      ====================================================== */}

      <aside className="sidebar">


        <div className="brand">

          <div className="logo">
            S
          </div>

          <div>

            <b>
              StressSense
            </b>

            <small>
              Behavioral Analytics
            </small>

          </div>

        </div>


        <nav>


          <div className="nav-section">
            ANALYTICS
          </div>


          {pages
            .slice(0, 4)
            .map(
              ([id, label]) => (

                <button
                  className={`nav-item ${
                    page === id
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setPage(id)
                  }
                  key={id}
                >

                  <span
                    className="nav-symbol"
                  >

                    {id ===
                    'overview'
                      ? '▦'
                      : id ===
                        'participants'
                      ? '●'
                      : id ===
                        'assessment'
                      ? '✦'
                      : '⌁'}

                  </span>

                  {label}

                </button>

              )
            )}


          <div className="nav-section">
            MONITORING
          </div>


          {pages
            .slice(4, 6)
            .map(
              ([id, label]) => (

                <button
                  className={`nav-item ${
                    page === id
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setPage(id)
                  }
                  key={id}
                >

                  <span
                    className="nav-symbol"
                  >

                    {id ===
                    'warnings'
                      ? '△'
                      : '◆'}

                  </span>


                  {label}


                  {id ===
                    'warnings' &&
                    warnings.length >
                      0 && (

                      <span
                        className="nav-count"
                      >

                        {
                          warnings.filter(
                            x =>
                              x.warning
                          ).length
                        }

                      </span>

                    )}

                </button>

              )
            )}

        </nav>


        <div className="sidebar-bottom">


          <div className="system-status">

            <span
              className="status-dot"
            />

            <div>

              <strong>
                System Online
              </strong>

              <small>
                FastAPI analytics
                engine active
              </small>

            </div>

          </div>


          <div className="privacy-note">
            Privacy-first analytics
          </div>


          <div className="prototype-note">

            Research prototype
            <br />
            Not a medical diagnosis

          </div>


        </div>


      </aside>


      {/* ======================================================
         MAIN
      ====================================================== */}

      <main className="main">


        <header className="header">


          <div>


            <div className="breadcrumb">

              {page ===
                'assessment'

                ? 'Tools / Personal Assessment'

                : page ===
                  'warnings'

                ? 'Monitoring / Early Warning'

                : page ===
                  'signals'

                ? 'Monitoring / Behavioral Signals'

                : `Analytics / ${title}`}

            </div>


            <h1>
              {title}
            </h1>


            <p>

              {page ===
              'assessment'

                ? 'Complete a short wellness screening and receive a model-based stress-risk estimate.'

                : 'Monitor behavioral patterns and identify early signs of elevated stress.'}

            </p>


          </div>


          <button
            className="refresh-button"
            onClick={load}
          >
            ↻ Refresh
          </button>


        </header>


        {error && (

          <div className="alert">
            {error}
          </div>

        )}


        {/* ====================================================
           OVERVIEW
        ==================================================== */}

        {page ===
          'overview' &&
          data && (

            <>


              <section className="cards">


                <Metric

                  label="Participants"

                  value={
                    data.summary
                      .participants
                  }

                  hint="Unique participants"

                  icon="◉"

                />


                <Metric

                  label="Average Stress"

                  value={`${data.summary.avg_stress}/5`}

                  hint="Across observed days"

                  icon="◒"

                />


                <Metric

                  label="High Risk"

                  value={
                    riskCounts.High +
                    riskCounts.Critical
                  }

                  hint="Participants requiring attention"

                  icon="!"

                />


                <Metric

                  label="Data Days"

                  value={
                    data.summary
                      .observations
                  }

                  hint="Behavioral observations"

                  icon="◷"

                />


              </section>


              <section
                className="overview-grid"
              >


                {/* STRESS TRAJECTORY */}

                <div
                  className="panel chart-panel trajectory-panel"
                >


                  <div
                    className="panel-heading"
                  >

                    <div>

                      <h2>
                        Stress Trajectory
                      </h2>

                      <p>
                        Average stress across the
                        latest available observations.
                      </p>

                    </div>


                    <span
                      className="live-badge"
                    >
                      LIVE
                    </span>

                  </div>


                  <ResponsiveContainer
                    width="100%"
                    height={270}
                  >

                    <AreaChart
                      data={data.trend}
                    >

                      <defs>

                        <linearGradient
                          id="stressFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >

                          <stop
                            offset="0%"
                            stopOpacity={0.25}
                          />

                          <stop
                            offset="100%"
                            stopOpacity={0.03}
                          />

                        </linearGradient>

                      </defs>


                      <CartesianGrid
                        strokeDasharray="3 3"
                      />


                      <XAxis
                        dataKey="date"
                        tick={{
                          fontSize: 9
                        }}
                        tickFormatter={
                          v =>
                            String(v)
                              .slice(5)
                        }
                        interval={3}
                      />


                      <YAxis
                        domain={[0, 5]}
                        tick={{
                          fontSize: 10
                        }}
                      />


                      <Tooltip />


                      <Area
                        type="monotone"
                        dataKey="stress"
                        strokeWidth={2.5}
                        fill="url(#stressFill)"
                      />


                    </AreaChart>

                  </ResponsiveContainer>


                </div>


                {/* RISK DISTRIBUTION */}

                <div
                  className="panel chart-panel risk-panel"
                >


                  <div
                    className="panel-heading"
                  >

                    <div>

                      <h2>
                        Risk Distribution
                      </h2>

                      <p>
                        Current participant
                        risk classification.
                      </p>

                    </div>

                  </div>


                  <ResponsiveContainer
                    width="100%"
                    height={270}
                  >

                    <PieChart>

                      <Pie

                        data={[
                          {
                            name:
                              'High',
                            value:
                              riskCounts.High
                          },

                          {
                            name:
                              'Low',
                            value:
                              riskCounts.Low
                          },

                          {
                            name:
                              'Moderate',
                            value:
                              riskCounts.Moderate
                          },

                          {
                            name:
                              'Critical',
                            value:
                              riskCounts.Critical
                          }
                        ]}

                        dataKey="value"

                        nameKey="name"

                        outerRadius={84}

                        label

                      >

                        {[0, 1, 2, 3]
                          .map(
                            i => (
                              <Cell
                                key={i}
                              />
                            )
                          )}

                      </Pie>


                      <Tooltip />


                      <Legend
                        verticalAlign="bottom"
                      />

                    </PieChart>

                  </ResponsiveContainer>


                </div>


                {/* STRESS LEVEL DISTRIBUTION */}

                <div
                  className="panel chart-panel distribution-panel"
                >


                  <div
                    className="panel-heading"
                  >

                    <div>

                      <h2>
                        Stress Level Distribution
                      </h2>

                      <p>
                        Participant average
                        stress levels from 1–5.
                      </p>

                    </div>

                  </div>


                  <ResponsiveContainer
                    width="100%"
                    height={245}
                  >

                    <BarChart
                      data={
                        stressDistribution
                      }
                      margin={{
                        top: 8,
                        right: 10,
                        left: -20,
                        bottom: 0
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />


                      <XAxis
                        dataKey="level"
                        tick={{
                          fontSize: 10
                        }}
                      />


                      <YAxis
                        tick={{
                          fontSize: 10
                        }}
                        allowDecimals={false}
                      />


                      <Tooltip />


                      <Bar
                        dataKey="count"
                        radius={[
                          4,
                          4,
                          0,
                          0
                        ]}
                      />

                    </BarChart>

                  </ResponsiveContainer>


                </div>


                {/* TOP FACTORS */}

                <div
                  className="panel chart-panel factor-chart-panel"
                >


                  <div
                    className="panel-heading"
                  >

                    <div>

                      <h2>
                        Top Stress-Associated Factors
                      </h2>

                      <p>
                        Signals ranked by model
                        predictive importance.
                      </p>

                    </div>


                    <span
                      className="analysis-badge"
                    >
                      ANALYTICS
                    </span>

                  </div>


                  <FactorBars
                    factors={
                      data.top_factors
                    }
                    limit={7}
                  />


                </div>


              </section>


              {/* WHY STRESS IS INCREASING */}

              <section
                className="panel why-panel"
              >


                <div
                  className="panel-heading"
                >

                  <div>

                    <h2>
                      Why Is Stress Increasing?
                    </h2>

                    <p>
                      Factors most strongly
                      associated with elevated
                      stress in the available
                      analytics data.
                    </p>

                  </div>


                  <span
                    className="analysis-badge"
                  >
                    FACTOR ANALYSIS
                  </span>

                </div>


                <div className="why-grid">


                  <div
                    className="primary-driver"
                  >

                    <div
                      className="driver-icon"
                    >
                      !
                    </div>


                    <div>

                      <span
                        className="eyebrow"
                      >
                        PRIMARY STRESS DRIVER
                      </span>


                      <h3>

                        {primaryFactor

                          ? humanFactor(
                              primaryFactor.feature
                            )

                          : 'No factor available'}

                      </h3>


                      <p>
                        This is the strongest
                        predictive factor in the
                        current model. It represents
                        association with the model
                        output, not proof of causation.
                      </p>


                      {primaryFactor && (

                        <div
                          className="contribution"
                        >

                          Predictive importance:{' '}

                          <b>
                            {Number(
                              primaryFactor.importance
                            ).toFixed(4)}
                          </b>

                        </div>

                      )}

                    </div>

                  </div>


                  <FactorBars
                    factors={
                      data.top_factors
                    }
                    limit={10}
                  />


                </div>


                <div
                  className="disclaimer-strip"
                >
                  These signals represent
                  association in the available
                  dataset, not proof that a factor
                  causes stress.
                </div>


              </section>


              {/* EARLY WARNING + STRESS ANALYSIS */}

              <section
                className="overview-bottom"
              >


                <div
                  className="panel mini-warning-panel"
                >


                  <div
                    className="panel-heading"
                  >

                    <div>

                      <h2>
                        Early Warning
                      </h2>

                      <p>
                        Participants requiring
                        attention.
                      </p>

                    </div>


                    <span
                      className="alert-count"
                    >
                      {
                        warnings.filter(
                          x => x.warning
                        ).length
                      }
                    </span>

                  </div>


                  {displayWarnings
                    .slice(0, 5)
                    .map(
                      (w, i) => (

                        <div
                          className="mini-warning"
                          key={i}
                        >

                          <div
                            className="participant-avatar"
                          >
                            {String(w.uid)
                              .slice(-2)
                              .toUpperCase()}
                          </div>


                          <div>

                            <b>
                              Participant u
                              {w.uid}
                            </b>

                            <small>
                              Stress score:{' '}
                              {w.stress ??
                                '—'}
                              /5
                            </small>

                          </div>


                          <RiskBadge
                            risk={
                              w.risk ||
                              riskFromStress(
                                w.stress
                              )
                            }
                          />

                        </div>

                      )
                    )}

                </div>


                <div
                  className="panel stress-analysis"
                >


                  <div
                    className="panel-heading"
                  >

                    <div>

                      <h2>
                        Stress Analysis
                      </h2>

                      <p>
                        Current system
                        interpretation.
                      </p>

                    </div>

                  </div>


                  <div
                    className="analysis-score"
                  >

                    <strong>
                      {data.summary.avg_stress}
                    </strong>

                    <span>
                      Average stress score
                    </span>

                  </div>


                  <p>
                    Current observations indicate
                    a mixed stress profile across
                    participants. Use the trend,
                    distribution and model-important
                    factors together rather than
                    interpreting a single signal in
                    isolation.
                  </p>


                </div>


              </section>


            </>

          )}


        {/* ====================================================
           PARTICIPANTS
        ==================================================== */}

        {page ===
          'participants' && (

            <div
              className="panel participants-panel"
            >


              <div
                className="panel-heading"
              >

                <div>

                  <h2>
                    Participants
                  </h2>

                  <p>
                    Explore participant-level
                    stress status and detailed
                    observations.
                  </p>

                </div>


                <b>
                  {participants.length}
                  {' '}
                  participants
                </b>

              </div>


              <div
                className="table-wrap"
              >


                <table>


                  <thead>

                    <tr>

                      <th>
                        Participant
                      </th>

                      <th>
                        Stress Score
                      </th>

                      <th>
                        Risk Level
                      </th>

                      <th>
                        Early Warning
                      </th>

                      <th>
                        Latest Observation
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>


                    {participants.map(
                      x => {

                        const risk =
                          riskFromStress(
                            x.avg_stress
                          );


                        const warning =
                          warnings.some(
                            v =>
                              String(v.uid) ===
                                String(x.uid) &&
                              v.warning
                          );


                        return (

                          <tr
                            key={x.uid}
                          >


                            <td>

                              <div
                                className="participant-cell"
                              >

                                <div
                                  className="participant-avatar"
                                >
                                  {String(
                                    x.uid
                                  )
                                    .slice(-2)
                                    .toUpperCase()}
                                </div>


                                <strong>
                                  u{x.uid}
                                </strong>

                              </div>

                            </td>


                            <td>

                              <strong>
                                {Number(
                                  x.avg_stress
                                ).toFixed(1)}
                              </strong>{' '}

                              <span
                                className="muted"
                              >
                                /5
                              </span>

                            </td>


                            <td>

                              <RiskBadge
                                risk={risk}
                              />

                            </td>


                            <td>

                              {warning ? (

                                <span
                                  className="warning-text"
                                >
                                  ⚠ Elevated
                                </span>

                              ) : (

                                <span
                                  className="normal-text"
                                >
                                  ✓ Normal
                                </span>

                              )}

                            </td>


                            <td>
                              {x.latest_date}
                            </td>


                            <td>

                              <button
                                className="small-button"
                                onClick={() =>
                                  setSelectedParticipant(
                                    x
                                  )
                                }
                              >
                                View
                              </button>

                            </td>


                          </tr>

                        );

                      }
                    )}

                  </tbody>


                </table>


              </div>


            </div>

          )}


        {/* ====================================================
           STRESS TRENDS
        ==================================================== */}

        {page ===
          'trends' &&
          data && (

            <div
              className="panel trends-panel"
            >


              <div
                className="panel-heading"
              >

                <div>

                  <h2>
                    Stress Trends
                  </h2>

                  <p>
                    Interactive stress
                    observations returned by
                    the analytics engine.
                  </p>

                </div>


                <span
                  className="live-badge"
                >
                  LIVE DATA
                </span>

              </div>


              <ResponsiveContainer
                width="100%"
                height={430}
              >

                <BarChart
                  data={
                    data.trend.slice(-32)
                  }
                  margin={{
                    top: 25,
                    right: 10,
                    left: 10,
                    bottom: 5
                  }}
                >


                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                  />


                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 9
                    }}
                    tickFormatter={
                      v =>
                        String(v)
                          .slice(5)
                    }
                    interval={0}
                  />


                  <YAxis
                    domain={[0, 5]}
                    hide
                  />


                  <Tooltip
                    formatter={
                      value => [
                        `${value}/5`,
                        'Stress'
                      ]
                    }
                  />


                  <Bar
                    dataKey="stress"
                    radius={[
                      7,
                      7,
                      0,
                      0
                    ]}
                  />


                </BarChart>

              </ResponsiveContainer>


              <div
                className="trend-foot"
              >

                <span>
                  StressSense Behavioral
                  Analytics
                </span>

                <span>
                  Early-warning estimates are
                  not medical diagnoses.
                </span>

              </div>


            </div>

          )}


        {/* ====================================================
           EARLY WARNING
        ==================================================== */}

        {page ===
          'warnings' && (

            <div
              className="panel warning-page"
            >


              <div
                className="panel-heading"
              >

                <div>

                  <h2>
                    Early Warning Center
                  </h2>

                  <p>
                    Review participants currently
                    flagged by the analytics engine.
                  </p>

                </div>


                <span
                  className="alert-count"
                >

                  {
                    warnings.filter(
                      x => x.warning
                    ).length
                  }

                  {' '}
                  alerts

                </span>

              </div>


              <div
                className="warning-grid"
              >


                {displayWarnings.map(
                  (w, i) => (

                    <div
                      className="warning-card"
                      key={`${w.uid}-${w.date}-${i}`}
                    >


                      <div
                        className="warning-card-top"
                      >

                        <div
                          className="alert-avatar"
                        >
                          {String(w.uid)
                            .slice(-2)
                            .toUpperCase()}
                        </div>


                        <RiskBadge
                          risk={
                            w.risk ||
                            riskFromStress(
                              w.stress
                            )
                          }
                        />

                      </div>


                      <h3>
                        Participant u{w.uid}
                      </h3>


                      <p>

                        Stress score:{' '}

                        <strong>
                          {w.stress ??
                            '—'}
                          /5
                        </strong>

                      </p>


                      <p
                        className="warning-prob"
                      >

                        Early-warning probability:{' '}

                        <b>

                          {(
                            Number(
                              w.probability
                            ) * 100
                          ).toFixed(1)}

                          %

                        </b>

                      </p>


                      <button
                        className="secondary-button"
                        onClick={() => {

                          const p =
                            participants.find(
                              x =>
                                String(
                                  x.uid
                                ) ===
                                String(
                                  w.uid
                                )
                            );


                          if (p) {

                            setSelectedParticipant(
                              p
                            );

                          }

                        }}
                      >
                        View participant
                      </button>


                    </div>

                  )
                )}


              </div>


            </div>

          )}


        {/* ====================================================
           BEHAVIORAL SIGNALS
        ==================================================== */}

        {page ===
          'signals' && (

            <div
              className="signals-page"
            >


              <section
                className="panel"
              >


                <div
                  className="panel-heading"
                >

                  <div>

                    <h2>
                      Behavioral Signals
                    </h2>

                    <p>
                      Explore behavioral factors
                      currently exposed by the
                      analytics pipeline.
                    </p>

                  </div>


                  <span
                    className="analysis-badge"
                  >
                    ML FACTORS
                  </span>

                </div>


                <div
                  className="signal-grid"
                >


                  {behavioralSignalNames.map(
                    (name, i) => {

                      const value =
                        behavioralSignalValues[
                          name
                        ];

                      const maxValue =
                        behavioralSignalValues[
                          'audio_events'
                        ];


                      return (

                        <div
                          className="signal-card"
                          key={name}
                        >


                          <div
                            className="signal-top"
                          >

                            <span>
                              #{i + 1}
                            </span>

                            <b>
                              {value.toFixed(2)}
                            </b>

                          </div>


                          <h3>
                            {name}
                          </h3>


                          <div
                            className="signal-track"
                          >

                            <i
                              style={{
                                width: `${Math.max(
                                  1,
                                  (
                                    value /
                                    maxValue
                                  ) * 100
                                )}%`
                              }}
                            />

                          </div>


                          <small>
                            Relative contribution
                          </small>


                        </div>

                      );

                    }
                  )}


                </div>


              </section>


              <section
                className="panel driver-panel"
              >


                <div
                  className="panel-heading"
                >

                  <div>

                    <h2>
                      Stress Driver Interpretation
                    </h2>

                    <p>
                      The strongest
                      model-important factor is
                      highlighted below.
                    </p>

                  </div>

                </div>


                <div
                  className="driver-grid"
                >


                  <div
                    className="primary-driver"
                  >

                    <div
                      className="driver-icon"
                    >
                      !
                    </div>


                    <div>

                      <span
                        className="eyebrow"
                      >
                        PRIMARY STRESS DRIVER
                      </span>


                      <h3>

                        {primaryFactor

                          ? humanFactor(
                              primaryFactor.feature
                            )

                          : 'No factor available'}

                      </h3>


                      <p>
                        Model importance indicates
                        predictive contribution. It
                        does not establish that this
                        signal causes stress.
                      </p>

                    </div>

                  </div>


                  <FactorBars
                    factors={
                      data?.top_factors ||
                      []
                    }
                    limit={8}
                  />


                </div>


              </section>


            </div>

          )}


        {/* ====================================================
           PERSONAL ASSESSMENT
        ==================================================== */}

        {page ===
          'assessment' && (

            <div
              className="assessment"
            >


              <style>{`

                .assessment-form-grid {
                  display: grid;
                  grid-template-columns:
                    repeat(
                      2,
                      minmax(0, 1fr)
                    );
                  gap: 18px 22px;
                }

                .assessment-form-grid
                .full-width {
                  grid-column:
                    1 / -1;
                }

                .assessment-question {
                  display: flex;
                  flex-direction:
                    column;
                  gap: 8px;
                }

                .assessment-question
                > span,
                .assessment-rating-label {
                  font-weight: 700;
                  color: #17233d;
                  font-size: 14px;
                }

                .assessment-question
                input[type="number"] {
                  width: 100%;
                  box-sizing:
                    border-box;
                }

                .rating-options {
                  display: grid;
                  grid-template-columns:
                    repeat(
                      5,
                      minmax(0, 1fr)
                    );
                  gap: 8px;
                }

                .rating-option {
                  position: relative;
                }

                .rating-option input {
                  position: absolute;
                  opacity: 0;
                  pointer-events: none;
                }

                .rating-option span {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 42px;
                  border:
                    1px solid #dbe4f0;
                  border-radius: 9px;
                  background: #f8fafc;
                  color: #52637d;
                  font-weight: 700;
                  cursor: pointer;
                  transition: .15s ease;
                }

                .rating-option
                input:checked + span {
                  background: #2f67d8;
                  border-color: #2f67d8;
                  color: white;
                  box-shadow:
                    0 4px 12px
                    rgba(
                      47,
                      103,
                      216,
                      .18
                    );
                }

                .assessment-help {
                  color: #7a8aa3;
                  font-size: 12px;
                  margin-top: -2px;
                }

                .assessment-result-head {
                  text-align: center;
                }

                .assessment-result-head
                h2 {
                  margin-bottom: 20px;
                }

                .assessment-score-wrap {
                  display: flex;
                  justify-content: center;
                  margin:
                    4px 0 18px;
                }

                .assessment-score-circle {
                  width: 132px;
                  height: 132px;
                  border-radius: 50%;
                  border:
                    8px solid #dce9ff;
                  display: flex;
                  flex-direction:
                    column;
                  align-items: center;
                  justify-content: center;
                  background: #fbfdff;
                  color: #2f67d8;
                }

                .assessment-score-circle
                strong {
                  font-size: 32px;
                  line-height: 1;
                }

                .assessment-score-circle
                small {
                  margin-top: 7px;
                  color: #71839f;
                }

                .assessment-result-message {
                  color: #667894;
                  max-width: 700px;
                  margin:
                    20px auto 26px;
                  line-height: 1.6;
                }

                .assessment-result-section {
                  margin-top: 24px;
                }

                .assessment-result-section
                h3 {
                  margin-bottom: 10px;
                }

                .assessment-result-list {
                  display: grid;
                  gap: 8px;
                }

                .assessment-result-item {
                  padding:
                    11px 14px;
                  border:
                    1px solid #e5eaf1;
                  background: #f8fafc;
                  border-radius: 8px;
                  color: #61728d;
                  font-size: 13px;
                }

                .assessment-result-item::before {
                  content: '•';
                  margin-right: 8px;
                  color: #2f67d8;
                  font-weight: 800;
                }

                .assessment-disclaimer {
                  margin-top: 22px;
                  padding:
                    12px 14px;
                  border-radius: 8px;
                  background: #f5f7fa;
                  color: #8390a4;
                  font-size: 11px;
                  text-align: center;
                }

                @media (max-width: 760px) {

                  .assessment-form-grid {
                    grid-template-columns:
                      1fr;
                  }

                  .assessment-form-grid
                  .full-width {
                    grid-column:
                      auto;
                  }

                }

              `}</style>


              {!assessment && (

                <form
                  className="panel form"
                  onSubmit={submit}
                >


                  <div
                    className="panel-heading form-title"
                  >

                    <div>

                      <h2>
                        Personal Stress Assessment
                      </h2>

                      <p>
                        Complete a short wellness
                        screening using the scales
                        used by the assessment model.
                      </p>

                    </div>

                  </div>


                  <div
                    className="assessment-form-grid"
                  >


                    <label
                      className="assessment-question"
                    >

                      <span>
                        Name
                      </span>

                      <input
                        name="name"
                        type="text"
                        required
                        placeholder="Enter your name"
                      />

                    </label>


                    <label
                      className="assessment-question"
                    >

                      <span>
                        Age
                      </span>

                      <input
                        name="age"
                        type="number"
                        min="13"
                        max="100"
                        required
                        placeholder="Enter your age"
                      />

                    </label>


                    <label
                      className="assessment-question"
                    >

                      <span>
                        Sleep hours
                      </span>

                      <input
                        name="sleep_hours"
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        defaultValue="8"
                        required
                      />

                    </label>


                    <label
                      className="assessment-question"
                    >

                      <span>
                        Work / study hours
                      </span>

                      <input
                        name="work_study_hours"
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        defaultValue="8"
                        required
                      />

                    </label>


                    <label
                      className="assessment-question"
                    >

                      <span>
                        Physical activity hours
                      </span>

                      <input
                        name="physical_activity_hours"
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        defaultValue="1"
                        required
                      />

                    </label>


                    <label
                      className="assessment-question"
                    >

                      <span>
                        Screen time hours
                      </span>

                      <input
                        name="screen_time_hours"
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        defaultValue="5"
                        required
                      />

                    </label>


                    <div
                      className="assessment-question full-width"
                    >

                      <span
                        className="assessment-rating-label"
                      >
                        Mood
                      </span>


                      <div
                        className="rating-options"
                      >

                        {[1, 2, 3, 4, 5]
                          .map(
                            value => (

                              <label
                                className="rating-option"
                                key={
                                  `mood-${value}`
                                }
                              >

                                <input
                                  type="radio"
                                  name="mood"
                                  value={value}
                                  defaultChecked={
                                    value === 3
                                  }
                                  required
                                />

                                <span>
                                  {value}
                                </span>

                              </label>

                            )
                          )}

                      </div>


                      <small
                        className="assessment-help"
                      >
                        1 = very low mood ·
                        5 = very positive mood
                      </small>

                    </div>


                    <div
                      className="assessment-question full-width"
                    >

                      <span
                        className="assessment-rating-label"
                      >
                        Anxiety
                      </span>


                      <div
                        className="rating-options"
                      >

                        {[1, 2, 3, 4, 5]
                          .map(
                            value => (

                              <label
                                className="rating-option"
                                key={
                                  `anxiety-${value}`
                                }
                              >

                                <input
                                  type="radio"
                                  name="anxiety"
                                  value={value}
                                  defaultChecked={
                                    value === 3
                                  }
                                  required
                                />

                                <span>
                                  {value}
                                </span>

                              </label>

                            )
                          )}

                      </div>


                      <small
                        className="assessment-help"
                      >
                        1 = very low anxiety ·
                        5 = very high anxiety
                      </small>

                    </div>


                    <div
                      className="assessment-question full-width"
                    >

                      <span
                        className="assessment-rating-label"
                      >
                        Social interaction
                      </span>


                      <div
                        className="rating-options"
                      >

                        {[1, 2, 3, 4, 5]
                          .map(
                            value => (

                              <label
                                className="rating-option"
                                key={
                                  `social-${value}`
                                }
                              >

                                <input
                                  type="radio"
                                  name="social_interaction"
                                  value={value}
                                  defaultChecked={
                                    value === 3
                                  }
                                  required
                                />

                                <span>
                                  {value}
                                </span>

                              </label>

                            )
                          )}

                      </div>


                      <small
                        className="assessment-help"
                      >
                        1 = very low social
                        interaction ·
                        5 = very high social
                        interaction
                      </small>

                    </div>


                    <div
                      className="assessment-question full-width"
                    >

                      <span
                        className="assessment-rating-label"
                      >
                        Workload
                      </span>


                      <div
                        className="rating-options"
                      >

                        {[1, 2, 3, 4, 5]
                          .map(
                            value => (

                              <label
                                className="rating-option"
                                key={
                                  `workload-${value}`
                                }
                              >

                                <input
                                  type="radio"
                                  name="workload"
                                  value={value}
                                  defaultChecked={
                                    value === 3
                                  }
                                  required
                                />

                                <span>
                                  {value}
                                </span>

                              </label>

                            )
                          )}

                      </div>


                      <small
                        className="assessment-help"
                      >
                        1 = very low workload ·
                        5 = very high workload
                      </small>

                    </div>


                    <button
                      className="primary-button form-submit full-width"
                      type="submit"
                    >
                      Get My Assessment
                    </button>


                  </div>


                </form>

              )}


              {assessment && (

                <div
                  className="panel result"
                >


                  <div
                    className="assessment-result-head"
                  >


                    <div
                      className="assessment-complete"
                    >
                      ASSESSMENT COMPLETE
                    </div>


                    <h2>

                      {assessmentName

                        ? `${assessmentName}'s Result`

                        : 'Assessment Result'}

                    </h2>


                    <div
                      className="assessment-score-wrap"
                    >

                      <div
                        className="assessment-score-circle"
                      >

                        <strong>

                          {Number.isFinite(
                            Number(
                              assessment.score ??
                              assessment.stress_score
                            )
                          )

                            ? Number(
                                assessment.score ??
                                assessment.stress_score
                              ).toFixed(1)

                            : '—'}

                        </strong>


                        <small>
                          /100
                        </small>

                      </div>

                    </div>


                    <RiskBadge
                      risk={
                        assessment.risk ||
                        assessment.risk_level ||
                        'Low'
                      }
                    />


                    <p
                      className="assessment-result-message"
                    >

                      {assessment.message ||
                        assessment.explanation ||
                        'The assessment has been completed.'}

                    </p>


                  </div>


                  <div
                    className="assessment-result-section"
                  >

                    <h3>
                      Key Factors
                    </h3>


                    <div
                      className="assessment-result-list"
                    >

                      {(assessment.factors || [])
                        .length > 0 ? (

                        assessment.factors
                          .slice(0, 6)
                          .map(
                            (
                              factor,
                              index
                            ) => {

                              const text =
                                typeof factor ===
                                'string'

                                  ? factor

                                  : factor?.feature ||
                                    factor?.factor ||
                                    factor?.name ||
                                    factor?.label ||
                                    'Assessment factor';


                              return (

                                <div
                                  className="assessment-result-item"
                                  key={
                                    `${text}-${index}`
                                  }
                                >
                                  {text}
                                </div>

                              );

                            }
                          )

                      ) : (

                        <div
                          className="assessment-result-item"
                        >
                          No specific elevated
                          factors were returned
                          for this assessment.
                        </div>

                      )}

                    </div>

                  </div>


                  <div
                    className="assessment-result-section"
                  >

                    <h3>
                      Recommendations
                    </h3>


                    <div
                      className="assessment-result-list"
                    >

                      {(assessment.recommendations || [])
                        .length > 0 ? (

                        assessment.recommendations
                          .map(
                            (
                              item,
                              index
                            ) => (

                              <div
                                className="assessment-result-item"
                                key={
                                  `${item}-${index}`
                                }
                              >
                                {item}
                              </div>

                            )
                          )

                      ) : (

                        <div
                          className="assessment-result-item"
                        >
                          Continue monitoring
                          your routine and use
                          the assessment as an
                          awareness tool.
                        </div>

                      )}

                    </div>

                  </div>


                  <div
                    className="assessment-disclaimer"
                  >

                    {assessment.disclaimer ||

                      'This assessment is a wellness screening tool and is not a medical diagnosis.'}

                  </div>


                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: 22
                    }}
                  >

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        setAssessment(null)
                      }
                    >
                      Take Again
                    </button>

                  </div>


                </div>

              )}


            </div>

          )}


      </main>


      {/* ======================================================
         PARTICIPANT MODAL
      ====================================================== */}

      {selectedParticipant && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedParticipant(null)
          }
        >


          <div
            className="user-modal"
            onClick={e =>
              e.stopPropagation()
            }
          >


            <div
              className="modal-header"
            >


              <div>

                <span
                  className="eyebrow"
                >
                  PARTICIPANT DETAILS
                </span>


                <h2>
                  Participant u
                  {selectedParticipant.uid}
                </h2>

              </div>


              <button
                className="close-button"
                onClick={() =>
                  setSelectedParticipant(null)
                }
              >
                ×
              </button>


            </div>


            <div
              className="detail-grid"
            >


              <div>

                <span>
                  Stress score
                </span>


                <strong>

                  {Number(
                    selectedParticipant.avg_stress
                  ).toFixed(2)}

                  /5

                </strong>

              </div>


              <div>

                <span>
                  Risk level
                </span>


                <strong>

                  {riskFromStress(
                    selectedParticipant.avg_stress
                  )}

                </strong>

              </div>


              <div>

                <span>
                  Observed days
                </span>


                <strong>
                  {selectedParticipant.days}
                </strong>

              </div>


              <div>

                <span>
                  Latest observation
                </span>


                <strong>
                  {
                    selectedParticipant.latest_date
                  }
                </strong>

              </div>


            </div>


          </div>


        </div>

      )}


    </div>

  );

}


/* ============================================================
   ROOT
============================================================ */

createRoot(
  document.getElementById('root')
).render(
  <App />
);