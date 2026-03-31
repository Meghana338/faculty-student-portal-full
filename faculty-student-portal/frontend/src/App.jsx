import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const initialAuthForm = {
  name: '',
  email: '',
  password: '',
  role: 'student',
};

const initialProjectForm = {
  title: '',
  summary: '',
  description: '',
  requiredSkills: '',
  tags: '',
  yearAudience: '',
  futureProspectsText: '',
  futureProspectsMandatory: false,
  attachment: null,
};

const initialProfileForm = {
  headline: '',
  bio: '',
  department: '',
  graduationYear: '',
  linkedinUrl: '',
  githubUrl: '',
  skills: '',
  interests: '',
  achievements: '',
  facultyFeedbackSummary: '',
  profilePalette: 'sunrise',
  privateProjectsText: '',
  courseBackgroundText: '',
};

const initialEvaluationForm = {
  projectId: '',
  studentId: '',
  workQuality: '4',
  efficiency: '4',
  regularity: '4',
  contribution: '4',
  detailedFeedback: '',
  futureProspects: '',
};

const paletteLabels = {
  sunrise: 'Sunrise',
  lagoon: 'Lagoon',
  ember: 'Ember',
  forest: 'Forest',
};

const parseDelimitedList = (value, separator = ',') =>
  String(value || '')
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);

const parsePrivateProjects = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = '', description = '', stack = ''] = line.split('|').map((item) => item.trim());
      return {
        title,
        description,
        stack: parseDelimitedList(stack),
      };
    });

const parseCourseBackground = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [course = '', grade = ''] = line.split('|').map((item) => item.trim());
      return { course, grade };
    });

const toPrivateProjectsText = (projects = []) =>
  projects.map((project) => [project.title, project.description, (project.stack || []).join(', ')].join(' | ')).join('\n');

const toCourseBackgroundText = (courses = []) =>
  courses.map((item) => `${item.course || ''} | ${item.grade || ''}`).join('\n');

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [token, setToken] = useState(localStorage.getItem('portal_token') || '');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [facultyProfiles, setFacultyProfiles] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [evaluationForms, setEvaluationForms] = useState({});
  const [applicationDrafts, setApplicationDrafts] = useState({});
  const [discussionDrafts, setDiscussionDrafts] = useState({});
  const [discussionKinds, setDiscussionKinds] = useState({});
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const projectAttachmentInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const isFaculty = user?.role === 'faculty';
  const isStudentLike = user?.role === 'student' || user?.role === 'alumni';

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status !== 'archived'),
    [projects]
  );
  const archivedProjects = useMemo(
    () => projects.filter((project) => project.status === 'archived'),
    [projects]
  );

  const apiRequest = useCallback(async (path, options = {}, authToken = token) => {
    const isFormData = options.body instanceof FormData;
    const headers = { ...(options.headers || {}) };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }, [token]);

  const hydrateProfileForm = (incomingProfile) => {
    setProfileForm({
      headline: incomingProfile.headline || '',
      bio: incomingProfile.bio || '',
      department: incomingProfile.department || '',
      graduationYear: incomingProfile.graduationYear || '',
      linkedinUrl: incomingProfile.linkedinUrl || '',
      githubUrl: incomingProfile.githubUrl || '',
      skills: (incomingProfile.skills || []).join(', '),
      interests: (incomingProfile.interests || []).join(', '),
      achievements: (incomingProfile.achievements || []).join('\n'),
      facultyFeedbackSummary: incomingProfile.facultyFeedbackSummary || '',
      profilePalette: incomingProfile.profilePalette || 'sunrise',
      privateProjectsText: toPrivateProjectsText(incomingProfile.privateProjects || []),
      courseBackgroundText: toCourseBackgroundText(incomingProfile.courseBackground || []),
    });
  };

  const loadDashboard = useCallback(async (activeToken = token) => {
    if (!activeToken) return;

    const [meData, facultyData, projectData, evaluationData] = await Promise.all([
      apiRequest('/profiles/me', { method: 'GET' }, activeToken),
      apiRequest('/profiles/faculty', { method: 'GET' }, activeToken),
      apiRequest('/projects', { method: 'GET' }, activeToken),
      apiRequest('/evaluations/me', { method: 'GET' }, activeToken),
    ]);

    setProfile(meData.profile);
    hydrateProfileForm(meData.profile);
    setRecommendations(meData.recommendations || []);
    setFacultyProfiles(facultyData || []);
    setProjects(projectData || []);
    setEvaluations(evaluationData || []);
  }, [apiRequest, token]);

  useEffect(() => {
    if (!token) return;

    const bootstrap = async () => {
      try {
        const session = await apiRequest('/auth/me');
        setUser(session.user);
        await loadDashboard();
      } catch (error) {
        localStorage.removeItem('portal_token');
        setToken('');
        setUser(null);
        setProfile(null);
        setMessage(error.message);
      }
    };

    bootstrap();
  }, [apiRequest, loadDashboard, token]);

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    setToken('');
    setUser(null);
    setProfile(null);
    setProjects([]);
    setEvaluations([]);
    setFacultyProfiles([]);
    setRecommendations([]);
    setMessage('Logged out');
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        authMode === 'login'
          ? { email: authForm.email, password: authForm.password }
          : authForm;
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem('portal_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setAuthForm(initialAuthForm);
      setMessage(`Welcome, ${data.user.name}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      Object.entries(projectForm).forEach(([key, value]) => {
        if (key === 'attachment') {
          if (value) formData.append('attachment', value);
          return;
        }
        formData.append(key, value);
      });

      await apiRequest('/projects', {
        method: 'POST',
        body: formData,
      });

      setProjectForm(initialProjectForm);
      if (projectAttachmentInputRef.current) {
        projectAttachmentInputRef.current.value = '';
      }
      await loadDashboard();
      setMessage('Project posted and classified successfully');
      setActiveTab('discover');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await apiRequest('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({
          headline: profileForm.headline,
          bio: profileForm.bio,
          department: profileForm.department,
          graduationYear: profileForm.graduationYear,
          linkedinUrl: profileForm.linkedinUrl,
          githubUrl: profileForm.githubUrl,
          skills: parseDelimitedList(profileForm.skills),
          interests: parseDelimitedList(profileForm.interests),
          achievements: parseDelimitedList(profileForm.achievements, '\n'),
          facultyFeedbackSummary: profileForm.facultyFeedbackSummary,
          profilePalette: profileForm.profilePalette,
          privateProjects: JSON.stringify(parsePrivateProjects(profileForm.privateProjectsText)),
          courseBackground: JSON.stringify(parseCourseBackground(profileForm.courseBackgroundText)),
        }),
      });

      await loadDashboard();
      setMessage('Profile updated');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      await apiRequest('/profiles/me/resume', {
        method: 'POST',
        body: formData,
      });
      await loadDashboard();
      setMessage('Resume uploaded');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  const handleFollowToggle = async (facultyId) => {
    setLoading(true);
    setMessage('');

    try {
      await apiRequest(`/profiles/faculty/${facultyId}/follow`, {
        method: 'POST',
      });
      await loadDashboard();
      setMessage('Follow list updated');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (projectId) => {
    const pitch = (applicationDrafts[projectId] || '').trim();
    if (!pitch) {
      setMessage('Please add a short pitch before applying');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await apiRequest(`/projects/${projectId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ pitch }),
      });
      setApplicationDrafts((prev) => ({ ...prev, [projectId]: '' }));
      await loadDashboard();
      setMessage('Application submitted');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscussionSubmit = async (projectId) => {
    const messageValue = (discussionDrafts[projectId] || '').trim();
    if (!messageValue) {
      setMessage('Please write something before posting');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await apiRequest(`/projects/${projectId}/discussions`, {
        method: 'POST',
        body: JSON.stringify({
          message: messageValue,
          kind: discussionKinds[projectId] || 'question',
        }),
      });
      setDiscussionDrafts((prev) => ({ ...prev, [projectId]: '' }));
      await loadDashboard();
      setMessage('Discussion updated');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApplication = async (projectId, applicationId, decision) => {
    setLoading(true);
    setMessage('');

    try {
      await apiRequest(`/projects/${projectId}/applications/${applicationId}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      await loadDashboard();
      setMessage(`Application ${decision === 'accept' ? 'accepted' : 'declined'}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveProject = async (projectId) => {
    setLoading(true);
    setMessage('');

    try {
      await apiRequest(`/projects/${projectId}/archive`, {
        method: 'POST',
      });
      await loadDashboard();
      setMessage('Project archived');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluationChange = (projectId, field, value) => {
    setEvaluationForms((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || initialEvaluationForm),
        [field]: value,
      },
    }));
  };

  const handleCreateEvaluation = async (project) => {
    const form = evaluationForms[project._id];
    if (!form?.studentId || !form?.detailedFeedback) {
      setMessage('Choose a student and add detailed feedback');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await apiRequest('/evaluations', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          projectId: project._id,
        }),
      });
      setEvaluationForms((prev) => ({ ...prev, [project._id]: initialEvaluationForm }));
      await loadDashboard();
      setMessage('Evaluation stored permanently on the student profile');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProjectCard = (project, archived = false) => {
    const isFollowingProfessor = profile?.followedProfessors?.some((item) => item._id === project.professor?._id);
    const availableContributors = project.contributors || [];
    const evaluationForm = evaluationForms[project._id] || initialEvaluationForm;

    return (
      <article key={project._id} className="project-card">
        <div className="card-topline">
          <span className="badge badge-warm">{project.basket}</span>
          <span className="badge">{project.projectType}</span>
          {project.recommendationScore > 0 ? <span className="badge badge-highlight">Recommended for you</span> : null}
        </div>
        <h3>{project.title}</h3>
        <p className="muted">
          By {project.professor?.name} · {project.professor?.department || 'Faculty mentor'}
          {isFollowingProfessor ? ' · Followed' : ''}
        </p>
        <p>{project.summary}</p>
        <p className="flavor">{project.flavorText}</p>

        <div className="token-row">
          {(project.requiredSkills || []).map((skill) => (
            <span key={skill} className="token">
              {skill}
            </span>
          ))}
        </div>

        <div className="project-grid">
          <section className="soft-panel">
            <h4>Description</h4>
            <p>{project.description}</p>
          </section>
          <section className="soft-panel">
            <h4>Future prospects</h4>
            <p>{project.futureProspects?.text || 'Not added yet'}</p>
            <p className="muted">{project.futureProspects?.isMandatory ? 'Mandatory section' : 'Optional section'}</p>
          </section>
        </div>

        {project.attachmentUrl ? (
          <p className="link-row">
            <a href={project.attachmentUrl} target="_blank" rel="noreferrer">
              Open attached file
            </a>
          </p>
        ) : null}

        <section className="soft-panel">
          <h4>Discussion</h4>
          <div className="discussion-list">
            {(project.discussions || []).length === 0 ? <p className="muted">No questions or comments yet.</p> : null}
            {(project.discussions || []).map((discussion) => (
              <div key={discussion._id} className="discussion-item">
                <strong>{discussion.author?.name}</strong>
                <span className="discussion-kind">{discussion.kind}</span>
                <p>{discussion.message}</p>
              </div>
            ))}
          </div>
          <div className="composer">
            <select
              value={discussionKinds[project._id] || 'question'}
              onChange={(event) =>
                setDiscussionKinds((prev) => ({ ...prev, [project._id]: event.target.value }))
              }
            >
              <option value="question">Question</option>
              <option value="comment">Comment</option>
            </select>
            <textarea
              rows={2}
              placeholder="Ask a question or add context"
              value={discussionDrafts[project._id] || ''}
              onChange={(event) =>
                setDiscussionDrafts((prev) => ({ ...prev, [project._id]: event.target.value }))
              }
            />
            <button type="button" onClick={() => handleDiscussionSubmit(project._id)} disabled={loading}>
              Post
            </button>
          </div>
        </section>

        {isStudentLike && !archived ? (
          <section className="soft-panel">
            <h4>Apply with context beyond your profile</h4>
            <textarea
              rows={3}
              placeholder="Explain why you fit this project, what you’ve built, or what you want to learn."
              value={applicationDrafts[project._id] || ''}
              onChange={(event) =>
                setApplicationDrafts((prev) => ({ ...prev, [project._id]: event.target.value }))
              }
            />
            <button type="button" className="primary" onClick={() => handleApply(project._id)} disabled={loading}>
              Apply to project
            </button>
          </section>
        ) : null}

        {isFaculty && user?.id === project.professor?._id ? (
          <section className="faculty-tools">
            <div className="soft-panel">
              <h4>Applications</h4>
              {(project.applications || []).length === 0 ? <p className="muted">No student applications yet.</p> : null}
              {(project.applications || []).map((application) => (
                <div className="application-card" key={application._id}>
                  <p>
                    <strong>{application.student?.name}</strong> · {application.student?.headline || 'Student'}
                  </p>
                  <p>{application.pitch}</p>
                  <p className="muted">Status: {application.status}</p>
                  {application.status === 'submitted' ? (
                    <div className="button-row">
                      <button
                        type="button"
                        onClick={() => handleReviewApplication(project._id, application._id, 'accept')}
                        disabled={loading}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewApplication(project._id, application._id, 'decline')}
                        disabled={loading}
                      >
                        Decline
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="soft-panel">
              <h4>Evaluation report</h4>
              <select
                value={evaluationForm.studentId || ''}
                onChange={(event) => handleEvaluationChange(project._id, 'studentId', event.target.value)}
              >
                <option value="">Select contributor</option>
                {availableContributors.map((contributor) => (
                  <option key={contributor._id} value={contributor._id}>
                    {contributor.name}
                  </option>
                ))}
              </select>
              {['workQuality', 'efficiency', 'regularity', 'contribution'].map((metric) => (
                <label key={metric}>
                  {metric}
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={evaluationForm[metric] || '4'}
                    onChange={(event) => handleEvaluationChange(project._id, metric, event.target.value)}
                  />
                </label>
              ))}
              <textarea
                rows={3}
                placeholder="Detailed faculty feedback"
                value={evaluationForm.detailedFeedback || ''}
                onChange={(event) => handleEvaluationChange(project._id, 'detailedFeedback', event.target.value)}
              />
              <textarea
                rows={2}
                placeholder="Future prospects"
                value={evaluationForm.futureProspects || ''}
                onChange={(event) => handleEvaluationChange(project._id, 'futureProspects', event.target.value)}
              />
              <button type="button" className="primary" onClick={() => handleCreateEvaluation(project)} disabled={loading}>
                Save evaluation
              </button>
            </div>

            {!archived ? (
              <button type="button" onClick={() => handleArchiveProject(project._id)} disabled={loading}>
                Archive project
              </button>
            ) : null}
          </section>
        ) : null}
      </article>
    );
  };

  if (!token || !user) {
    return (
      <main className="app-shell auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Unified Faculty + Student Platform</p>
          <h1>MentorFlow Campus</h1>
          <p className="hero-copy">
            One place for project posting, discovery, evaluation, archiving, and long-term student growth records.
          </p>

          <div className="mode-switch">
            <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
              Login
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="stack" onSubmit={handleAuthSubmit}>
            {authMode === 'register' ? (
              <label>
                Name
                <input
                  name="name"
                  value={authForm.name}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
            ) : null}
            <label>
              Email
              <input
                name="email"
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                minLength={6}
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </label>
            {authMode === 'register' ? (
              <label>
                Role
                <select
                  name="role"
                  value={authForm.role}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="alumni">Alumni</option>
                </select>
              </label>
            ) : null}
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Working...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>

          {message ? <p className="message">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className={`app-shell palette-${profile?.profilePalette || 'sunrise'}`}>
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Unified Faculty + Student Platform</p>
          <h1>MentorFlow Campus</h1>
          <p className="hero-copy">
            Projects are discoverable, students get context-rich profiles, and faculty feedback becomes institutional memory.
          </p>
        </div>
        <div className="user-chip">
          <div>
            <strong>{user.name}</strong>
            <p>
              {user.role} · {profile?.headline || 'Profile in progress'}
            </p>
          </div>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Open projects</span>
          <strong>{activeProjects.length}</strong>
        </div>
        <div className="stat-card">
          <span>Recommended</span>
          <strong>{recommendations.length}</strong>
        </div>
        <div className="stat-card">
          <span>Stored evaluations</span>
          <strong>{evaluations.length}</strong>
        </div>
        <div className="stat-card">
          <span>Following</span>
          <strong>{profile?.followedProfessors?.length || 0}</strong>
        </div>
      </section>

      <nav className="tab-bar">
        {[
          ['discover', 'Project discovery'],
          ['profile', 'Student profile'],
          ['evaluations', 'Evaluations'],
          ['archive', 'Archive'],
        ].map(([value, label]) => (
          <button key={value} type="button" className={activeTab === value ? 'active' : ''} onClick={() => setActiveTab(value)}>
            {label}
          </button>
        ))}
      </nav>

      <section className="main-grid">
        <aside className="sidebar">
          <div className="panel">
            <h2>Notifications</h2>
            <div className="stack">
              {(profile?.notifications || []).length === 0 ? <p className="muted">No notifications yet.</p> : null}
              {(profile?.notifications || []).map((item, index) => (
                <div key={`${item.message}-${index}`} className="notification-item">
                  <strong>{item.type}</strong>
                  <p>{item.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Faculty to follow</h2>
            <div className="stack">
              {facultyProfiles.map((faculty) => {
                const isFollowed = profile?.followedProfessors?.some((item) => item._id === faculty._id);
                return (
                  <div key={faculty._id} className="faculty-card">
                    <strong>{faculty.name}</strong>
                    <p>{faculty.headline || faculty.department || faculty.role}</p>
                    <div className="token-row">
                      {(faculty.skills || []).slice(0, 3).map((skill) => (
                        <span key={skill} className="token">
                          {skill}
                        </span>
                      ))}
                    </div>
                    {faculty.role === 'faculty' ? (
                      <button type="button" onClick={() => handleFollowToggle(faculty._id)} disabled={loading}>
                        {isFollowed ? 'Unfollow' : 'Follow'}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="content-column">
          {activeTab === 'discover' ? (
            <>
              {isFaculty ? (
                <section className="panel">
                  <h2>Post a project</h2>
                  <form className="stack" onSubmit={handleCreateProject}>
                    <label>
                      Title
                      <input
                        value={projectForm.title}
                        onChange={(event) => setProjectForm((prev) => ({ ...prev, title: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Summary
                      <textarea
                        rows={2}
                        value={projectForm.summary}
                        onChange={(event) => setProjectForm((prev) => ({ ...prev, summary: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Full description
                      <textarea
                        rows={4}
                        value={projectForm.description}
                        onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
                        required
                      />
                    </label>
                    <div className="two-col">
                      <label>
                        Required skills
                        <input
                          placeholder="React, Node.js, Research"
                          value={projectForm.requiredSkills}
                          onChange={(event) =>
                            setProjectForm((prev) => ({ ...prev, requiredSkills: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Tags
                        <input
                          placeholder="informal, first-year, AI"
                          value={projectForm.tags}
                          onChange={(event) => setProjectForm((prev) => ({ ...prev, tags: event.target.value }))}
                        />
                      </label>
                    </div>
                    <div className="two-col">
                      <label>
                        Year audience
                        <input
                          placeholder="1st year, 2nd year, final year"
                          value={projectForm.yearAudience}
                          onChange={(event) =>
                            setProjectForm((prev) => ({ ...prev, yearAudience: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Attachment
                        <input
                          ref={projectAttachmentInputRef}
                          type="file"
                          onChange={(event) =>
                            setProjectForm((prev) => ({ ...prev, attachment: event.target.files?.[0] || null }))
                          }
                        />
                      </label>
                    </div>
                    <label>
                      Future prospects
                      <textarea
                        rows={2}
                        value={projectForm.futureProspectsText}
                        onChange={(event) =>
                          setProjectForm((prev) => ({ ...prev, futureProspectsText: event.target.value }))
                        }
                      />
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={projectForm.futureProspectsMandatory}
                        onChange={(event) =>
                          setProjectForm((prev) => ({
                            ...prev,
                            futureProspectsMandatory: event.target.checked,
                          }))
                        }
                      />
                      Mark future prospects as mandatory on the final page
                    </label>
                    <button type="submit" className="primary" disabled={loading}>
                      {loading ? 'Posting...' : 'Publish project'}
                    </button>
                  </form>
                </section>
              ) : (
                <section className="panel recommendation-panel">
                  <h2>Recommended projects</h2>
                  <p className="muted">Recommendations are additive. Nothing is hidden from you.</p>
                  <div className="stack">
                    {recommendations.length === 0 ? <p className="muted">Complete your profile to unlock stronger matches.</p> : null}
                    {recommendations.map((project) => (
                      <div key={project._id} className="recommendation-card">
                        <strong>{project.title}</strong>
                        <p>{project.flavorText}</p>
                        <span className="badge badge-highlight">Score {project.recommendationScore}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="panel">
                <div className="section-head">
                  <h2>Latest projects</h2>
                  <span>{activeProjects.length} visible to everyone</span>
                </div>
                <div className="stack">
                  {activeProjects.length === 0 ? <p className="muted">No projects posted yet.</p> : null}
                  {activeProjects.map((project) => renderProjectCard(project))}
                </div>
              </section>
            </>
          ) : null}

          {activeTab === 'profile' ? (
            <section className="panel profile-panel">
              <div className="profile-hero">
                <div>
                  <p className="eyebrow">Colorful student profile</p>
                  <h2>{profile?.name}</h2>
                  <p>{profile?.headline}</p>
                </div>
                <div className="verification-box">
                  <h3>Background verification</h3>
                  <p>Resume: {profile?.backgroundVerification?.resumeVerified ? 'Verified' : 'Pending'}</p>
                  <p>LinkedIn: {profile?.backgroundVerification?.linkedinVerified ? 'Verified' : 'Pending'}</p>
                  <p>GitHub: {profile?.backgroundVerification?.githubVerified ? 'Verified' : 'Pending'}</p>
                </div>
              </div>

              <form className="stack" onSubmit={handleSaveProfile}>
                <div className="two-col">
                  <label>
                    Headline
                    <input
                      value={profileForm.headline}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, headline: event.target.value }))}
                    />
                  </label>
                  <label>
                    Department
                    <input
                      value={profileForm.department}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, department: event.target.value }))}
                    />
                  </label>
                </div>
                <label>
                  Bio
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                  />
                </label>
                <div className="two-col">
                  <label>
                    LinkedIn URL
                    <input
                      value={profileForm.linkedinUrl}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, linkedinUrl: event.target.value }))}
                    />
                  </label>
                  <label>
                    GitHub URL
                    <input
                      value={profileForm.githubUrl}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, githubUrl: event.target.value }))}
                    />
                  </label>
                </div>
                <div className="two-col">
                  <label>
                    Skills
                    <input
                      placeholder="Node.js, CSS, Research"
                      value={profileForm.skills}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, skills: event.target.value }))}
                    />
                  </label>
                  <label>
                    Interests
                    <input
                      placeholder="AI, UI, Education"
                      value={profileForm.interests}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, interests: event.target.value }))}
                    />
                  </label>
                </div>
                <div className="two-col">
                  <label>
                    Achievements
                    <textarea
                      rows={3}
                      placeholder="One per line"
                      value={profileForm.achievements}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, achievements: event.target.value }))}
                    />
                  </label>
                  <label>
                    Faculty feedback summary
                    <textarea
                      rows={3}
                      value={profileForm.facultyFeedbackSummary}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, facultyFeedbackSummary: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="two-col">
                  <label>
                    Private projects
                    <textarea
                      rows={4}
                      placeholder="Title | Description | React, Node"
                      value={profileForm.privateProjectsText}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, privateProjectsText: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Course background
                    <textarea
                      rows={4}
                      placeholder="Data Structures | A"
                      value={profileForm.courseBackgroundText}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, courseBackgroundText: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="two-col">
                  <label>
                    Graduation year
                    <input
                      type="number"
                      value={profileForm.graduationYear}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, graduationYear: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Profile palette
                    <select
                      value={profileForm.profilePalette}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, profilePalette: event.target.value }))
                      }
                    >
                      {Object.entries(paletteLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="button-row">
                  <button type="submit" className="primary" disabled={loading}>
                    Save profile
                  </button>
                  <label className="upload-button">
                    Upload resume
                    <input ref={resumeInputRef} type="file" onChange={handleResumeUpload} />
                  </label>
                  {profile?.resumeUrl ? (
                    <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
                      Open resume
                    </a>
                  ) : null}
                </div>
              </form>
            </section>
          ) : null}

          {activeTab === 'evaluations' ? (
            <section className="panel">
              <div className="section-head">
                <h2>Permanent evaluations</h2>
                <span>Visible for future professors</span>
              </div>
              <div className="stack">
                {evaluations.length === 0 ? <p className="muted">No evaluations stored yet.</p> : null}
                {evaluations.map((evaluation) => (
                  <article key={evaluation._id} className="evaluation-card">
                    <div className="card-topline">
                      <span className="badge badge-warm">{evaluation.project?.basket || 'Project'}</span>
                      <span className="badge">{evaluation.project?.projectType || 'Evaluation'}</span>
                    </div>
                    <h3>{evaluation.project?.title}</h3>
                    <p className="muted">
                      Faculty: {evaluation.faculty?.name}
                      {evaluation.student?.name ? ` · Student: ${evaluation.student.name}` : ''}
                    </p>
                    <p>{evaluation.detailedFeedback}</p>
                    <div className="metric-grid">
                      <span>Quality: {evaluation.workQuality}/5</span>
                      <span>Efficiency: {evaluation.efficiency}/5</span>
                      <span>Regularity: {evaluation.regularity}/5</span>
                      <span>Contribution: {evaluation.contribution}/5</span>
                    </div>
                    <p className="printable-block">{evaluation.printableSummary}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === 'archive' ? (
            <section className="panel">
              <div className="section-head">
                <h2>Archived projects</h2>
                <span>Long-term institutional memory</span>
              </div>
              <div className="stack">
                {archivedProjects.length === 0 ? <p className="muted">No archived projects yet.</p> : null}
                {archivedProjects.map((project) => renderProjectCard(project, true))}
              </div>
            </section>
          ) : null}
        </section>
      </section>

      {message ? <div className="message-float">{message}</div> : null}
    </main>
  );
}

export default App;
