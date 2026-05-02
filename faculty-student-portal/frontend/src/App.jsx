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
  postKind: 'project',
  companyName: '',
  universityName: '',
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
  const [pitchCoach, setPitchCoach] = useState({});
  const [discussionCoach, setDiscussionCoach] = useState({});
  const [evaluationDrafts, setEvaluationDrafts] = useState({});
  const [verificationInsight, setVerificationInsight] = useState(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectKindFilter, setProjectKindFilter] = useState('all');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [progressDrafts, setProgressDrafts] = useState({});
  const [networkUsers, setNetworkUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [activeChatUserId, setActiveChatUserId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState('');
  const [resumeScanText, setResumeScanText] = useState('');
  const [resumeKeywords, setResumeKeywords] = useState('');
  const [resumeScanResult, setResumeScanResult] = useState(null);
  const [atsProjectId, setAtsProjectId] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [skillGapProjectId, setSkillGapProjectId] = useState('');
  const [skillGapResult, setSkillGapResult] = useState(null);
  const [facultyAiProjectId, setFacultyAiProjectId] = useState('');
  const [facultyEvaluationDraft, setFacultyEvaluationDraft] = useState(null);
  const [archiveInsights, setArchiveInsights] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityTitle, setCommunityTitle] = useState('');
  const [communityBody, setCommunityBody] = useState('');
  const [communityCommentDrafts, setCommunityCommentDrafts] = useState({});
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState('');
  const projectAttachmentInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const isFaculty = user?.role === 'faculty';
  const isAlumni = user?.role === 'alumni';
  const isStudentLike = user?.role === 'student' || user?.role === 'alumni';
  const canApplyToProjects = user?.role === 'student';
  const canUseCommunity = user?.role === 'student' || user?.role === 'alumni';
  const profileTabLabel = isFaculty ? 'Faculty profile' : isAlumni ? 'Alumni profile' : 'Student profile';
  const profileHeroLabel = isFaculty ? 'Faculty profile' : isAlumni ? 'Alumni profile' : 'Student profile';

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status !== 'archived'),
    [projects]
  );
  const archivedProjects = useMemo(
    () => projects.filter((project) => project.status === 'archived'),
    [projects]
  );
  const filteredActiveProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    return activeProjects.filter((project) => {
      if (projectKindFilter !== 'all') {
        if (projectKindFilter === 'alumni') {
          if (project.professor?.role !== 'alumni') return false;
        } else if ((project.postKind || 'project') !== projectKindFilter) {
          return false;
        }
      }
      const blob = [
        project.title,
        project.summary,
        project.description,
        project.companyName,
        project.universityName,
        project.postKind,
        ...(project.requiredSkills || []),
        ...(project.tags || []),
      ]
        .join(' ')
        .toLowerCase();
      return !query || blob.includes(query);
    });
  }, [activeProjects, projectSearch, projectKindFilter]);

  const filteredNetworkUsers = useMemo(() => {
    const query = peopleSearch.trim().toLowerCase();
    if (!query) return networkUsers;
    return networkUsers.filter((person) => {
      const blob = [person.name, person.role, person.status].join(' ').toLowerCase();
      return blob.includes(query);
    });
  }, [networkUsers, peopleSearch]);

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
      if (response.status === 401) {
        localStorage.removeItem('portal_token');
        setToken('');
        setUser(null);
        setProfile(null);
        throw new Error('Session expired. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(data.message || 'You do not have permission for this action.');
      }
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }, [token]);

  const callAi = useCallback(
    async (path, payload = {}) =>
      apiRequest(`/ai/${path}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    [apiRequest]
  );

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

    const [meData, facultyData, projectData] = await Promise.all([
      apiRequest('/profiles/me', { method: 'GET' }, activeToken),
      apiRequest('/profiles/faculty', { method: 'GET' }, activeToken),
      apiRequest('/projects', { method: 'GET' }, activeToken),
    ]);

    setProfile(meData.profile);
    hydrateProfileForm(meData.profile);
    setRecommendations(meData.recommendations || []);
    setFacultyProfiles(facultyData || []);
    setProjects(projectData || []);
  }, [apiRequest, token]);

  const loadEvaluations = useCallback(async (activeToken = token) => {
    if (!activeToken) return;
    const evaluationData = await apiRequest('/evaluations/me', { method: 'GET' }, activeToken);
    setEvaluations(evaluationData || []);
  }, [apiRequest, token]);

  const loadNetwork = useCallback(async () => {
    const data = await apiRequest('/profiles/network', { method: 'GET' });
    setNetworkUsers(data.users || []);
    setIncomingRequests(data.incomingRequests || []);
  }, [apiRequest]);

  const loadCommunity = useCallback(async () => {
    const data = await apiRequest('/community', { method: 'GET' });
    setCommunityPosts(Array.isArray(data) ? data : []);
  }, [apiRequest]);

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

  useEffect(() => {
    if (!token || activeTab !== 'network') return;
    loadNetwork().catch((error) => setMessage(error.message));
  }, [activeTab, loadNetwork, token]);

  useEffect(() => {
    if (!token || activeTab !== 'community' || !canUseCommunity) return;
    loadCommunity().catch((error) => setMessage(error.message));
  }, [activeTab, canUseCommunity, loadCommunity, token]);

  useEffect(() => {
    if (!token || activeTab !== 'evaluations') return;
    loadEvaluations().catch((error) => setMessage(error.message));
  }, [activeTab, loadEvaluations, token]);

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    setToken('');
    setUser(null);
    setProfile(null);
    setProjects([]);
    setEvaluations([]);
    setFacultyProfiles([]);
    setRecommendations([]);
    setNetworkUsers([]);
    setIncomingRequests([]);
    setCommunityPosts([]);
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
    if (!isFaculty && !isAlumni) {
      setMessage('Only faculty or alumni accounts can post.');
      return;
    }
    if (isAlumni && !['job', 'masters_project'].includes(projectForm.postKind)) {
      setMessage('Alumni can post only company jobs or masters projects.');
      return;
    }
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

  const handleFollowRequest = async (targetId) => {
    setLoading(true);
    setMessage('');
    try {
      await apiRequest(`/profiles/follow/${targetId}/request`, { method: 'POST' });
      await loadNetwork();
      setMessage('Follow request sent');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowRespond = async (requesterId, decision) => {
    setLoading(true);
    setMessage('');
    try {
      await apiRequest(`/profiles/follow/${requesterId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      await loadNetwork();
      setMessage(`Request ${decision}ed`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (targetId) => {
    try {
      const data = await apiRequest(`/chat/${targetId}`, { method: 'GET' });
      setActiveChatUserId(targetId);
      setChatMessages(data.messages || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const sendChatMessage = async () => {
    if (!activeChatUserId || !chatDraft.trim()) return;
    try {
      const data = await apiRequest(`/chat/${activeChatUserId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: chatDraft }),
      });
      setChatMessages(data.messages || []);
      setChatDraft('');
    } catch (error) {
      setMessage(error.message);
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

  const handlePitchCoach = async (projectId) => {
    const pitch = (applicationDrafts[projectId] || '').trim();
    if (!pitch) {
      setMessage('Write a pitch first to get AI coaching');
      return;
    }
    setAiLoading(true);
    try {
      const data = await callAi('pitch-coach', { pitch });
      setPitchCoach((prev) => ({ ...prev, [projectId]: data }));
      if (data?.improvedPitch) {
        setApplicationDrafts((prev) => ({ ...prev, [projectId]: data.improvedPitch }));
      }
      setMessage('Pitch coaching ready');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
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

  const handleDiscussionAssist = async (projectId) => {
    const draft = (discussionDrafts[projectId] || '').trim();
    if (!draft) {
      setMessage('Write a discussion message first');
      return;
    }
    setAiLoading(true);
    try {
      const data = await callAi('discussion-assist', { message: draft, context: projectId });
      setDiscussionCoach((prev) => ({ ...prev, [projectId]: data }));
      if (data?.suggestedReply) {
        setDiscussionDrafts((prev) => ({ ...prev, [projectId]: data.suggestedReply }));
      }
      setMessage('Discussion assistant ready');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
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

  const handleProgressUpdate = async (projectId) => {
    const updateText = (progressDrafts[projectId] || '').trim();
    if (!updateText) {
      setMessage('Write today\'s progress update first');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await apiRequest(`/projects/${projectId}/progress`, {
        method: 'POST',
        body: JSON.stringify({ updateText }),
      });
      setProgressDrafts((prev) => ({ ...prev, [projectId]: '' }));
      await loadDashboard();
      setMessage('Daily progress update posted');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunityPost = async () => {
    if (!canUseCommunity) {
      setMessage('Only students and alumni can post in community.');
      return;
    }
    const title = communityTitle.trim();
    const body = communityBody.trim();
    if (!title || !body) {
      setMessage('Add both title and content for community post.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await apiRequest('/community', {
        method: 'POST',
        body: JSON.stringify({ title, body }),
      });
      setCommunityTitle('');
      setCommunityBody('');
      await loadCommunity();
      setMessage('Community post published');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityComment = async (postId) => {
    if (!canUseCommunity) {
      setMessage('Only students and alumni can comment in community.');
      return;
    }
    const text = (communityCommentDrafts[postId] || '').trim();
    if (!text) {
      setMessage('Write a comment first');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await apiRequest(`/community/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setCommunityCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      await loadCommunity();
      setMessage('Comment posted');
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

  const handleEvaluationDraft = async (project) => {
    const form = evaluationForms[project._id] || initialEvaluationForm;
    if (!form.studentId) {
      setMessage('Choose a contributor first');
      return;
    }
    setAiLoading(true);
    try {
      const data = await callAi('evaluation-draft', {
        projectTitle: project.title,
        metrics: {
          workQuality: form.workQuality,
          efficiency: form.efficiency,
          regularity: form.regularity,
          contribution: form.contribution,
        },
      });
      setEvaluationDrafts((prev) => ({ ...prev, [project._id]: data }));
      setEvaluationForms((prev) => ({
        ...prev,
        [project._id]: {
          ...form,
          detailedFeedback: data.detailedFeedback || form.detailedFeedback,
          futureProspects: data.futureProspects || form.futureProspects,
        },
      }));
      setMessage('Evaluation draft generated');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleProjectAssist = async () => {
    if (!projectForm.title && !projectForm.description) {
      setMessage('Add title or description first');
      return;
    }
    setAiLoading(true);
    try {
      const data = await callAi('project-assist', {
        title: projectForm.title,
        summary: projectForm.summary,
        description: projectForm.description,
      });
      setProjectForm((prev) => ({
        ...prev,
        requiredSkills: (data.requiredSkills || []).join(', ') || prev.requiredSkills,
        tags: (data.tags || []).join(', ') || prev.tags,
      }));
      setMessage(`AI suggestion: ${data.basket || 'General'} / ${data.projectType || 'Research'}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleProfileExtract = async () => {
    const raw = profileForm.achievements || profileForm.bio || '';
    if (!raw.trim()) {
      setMessage('Add profile text first (bio or achievements)');
      return;
    }
    setAiLoading(true);
    try {
      const data = await callAi('profile-extract', { resumeText: raw });
      setProfileForm((prev) => ({
        ...prev,
        headline: data.headline || prev.headline,
        skills: (data.skills || []).join(', ') || prev.skills,
        interests: (data.interests || []).join(', ') || prev.interests,
        achievements: (data.achievements || []).join('\n') || prev.achievements,
        courseBackgroundText:
          (data.courseBackground || [])
            .map((item) => `${item.course || ''} | ${item.grade || ''}`)
            .join('\n') || prev.courseBackgroundText,
      }));
      setMessage('Profile fields boosted with AI extraction');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleVerificationScore = async () => {
    setAiLoading(true);
    try {
      const githubSkills = parseDelimitedList(profileForm.skills);
      const data = await callAi('verification-score', { githubSkills });
      setVerificationInsight(data);
      setMessage('Verification score updated');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleResumeKeywordScan = async () => {
    setAiLoading(true);
    try {
      const data = await callAi('resume-keyword-scan', {
        resumeText: resumeScanText,
        keywords: parseDelimitedList(resumeKeywords),
      });
      setResumeScanResult(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAtsScore = async () => {
    if (!atsProjectId) {
      setMessage('Select a project for ATS score');
      return;
    }
    setAiLoading(true);
    try {
      const data = await callAi('ats-score', { projectId: atsProjectId, resumeText: resumeScanText });
      setAtsResult(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSkillGap = async () => {
    if (!skillGapProjectId) {
      setMessage('Select a project for skill-gap analysis');
      return;
    }
    setAiLoading(true);
    try {
      const data = await callAi('skill-gap', { projectId: skillGapProjectId });
      setSkillGapResult(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFacultyEvaluationDraft = async () => {
    if (!facultyAiProjectId) {
      setMessage('Select a project first');
      return;
    }
    const selected = activeProjects.find((project) => project._id === facultyAiProjectId);
    if (!selected) {
      setMessage('Project not found');
      return;
    }
    setAiLoading(true);
    try {
      const data = await callAi('evaluation-draft', {
        projectTitle: selected.title,
        projectSummary: selected.summary,
        requiredSkills: selected.requiredSkills || [],
      });
      setFacultyEvaluationDraft(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleArchiveInsightsRefresh = async () => {
    setAiLoading(true);
    try {
      const data = await apiRequest('/ai/archive-insights', { method: 'GET' });
      setArchiveInsights(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAiLoading(false);
    }
  };


  const renderProjectCard = (project, archived = false) => {
    const isFollowingProfessor = profile?.followedProfessors?.some((item) => item._id === project.professor?._id);
    const availableContributors = project.contributors || [];
    const evaluationForm = evaluationForms[project._id] || initialEvaluationForm;
    const postKindLabel =
      project.postKind === 'job' ? 'Job post' : project.postKind === 'masters_project' ? 'Masters project' : 'Project';
    const isImageAttachment = String(project.attachmentUrl || '').startsWith('data:image/');

    return (
      <article key={project._id} className="project-card">
        <div className="card-topline">
          <span className="badge badge-highlight">{postKindLabel}</span>
          <span className="badge badge-warm">{project.basket}</span>
          <span className="badge">{project.projectType}</span>
          {project.recommendationScore > 0 ? <span className="badge badge-highlight">Recommended for you</span> : null}
        </div>
        <h3>{project.title}</h3>
        <p className="muted">
          By {project.professor?.name} ({project.professor?.role || 'member'}) · {project.professor?.department || 'Campus'}
          {isFollowingProfessor ? ' · Followed' : ''}
          {project.companyName ? ` · ${project.companyName}` : ''}
          {project.universityName ? ` · ${project.universityName}` : ''}
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
          <section className="soft-panel">
            <h4>Attachment</h4>
            {isImageAttachment ? <img src={project.attachmentUrl} alt={`Attachment for ${project.title}`} className="post-image" /> : null}
            <p className="link-row">
              <a href={project.attachmentUrl} target="_blank" rel="noreferrer">
                {isImageAttachment ? 'Open full image' : 'Open attached file'}
              </a>
            </p>
          </section>
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
            <button type="button" onClick={() => handleDiscussionAssist(project._id)} disabled={aiLoading}>
              AI Improve
            </button>
          </div>
          {discussionCoach[project._id]?.dedupHint ? <p className="muted">{discussionCoach[project._id].dedupHint}</p> : null}
        </section>

        {project.canViewProgress ? (
          <section className="soft-panel">
            <h4>Daily project progress (private)</h4>
            <div className="discussion-list">
              {(project.progressUpdates || []).length === 0 ? (
                <p className="muted">No progress updates yet. Start posting daily updates.</p>
              ) : null}
              {(project.progressUpdates || []).map((entry, index) => (
                <div key={entry._id || `${project._id}-progress-${index}`} className="discussion-item">
                  <strong>{entry.author?.name || 'Team member'}</strong>
                  <span className="discussion-kind">{new Date(entry.updateDate || Date.now()).toLocaleDateString()}</span>
                  <p>{entry.updateText}</p>
                </div>
              ))}
            </div>
            <div className="composer">
              <textarea
                rows={2}
                placeholder="What happened today on this project?"
                value={progressDrafts[project._id] || ''}
                onChange={(event) =>
                  setProgressDrafts((prev) => ({ ...prev, [project._id]: event.target.value }))
                }
              />
              <button type="button" onClick={() => handleProgressUpdate(project._id)} disabled={loading}>
                Post daily update
              </button>
            </div>
          </section>
        ) : null}

        {canApplyToProjects && !archived ? (
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
            <button type="button" onClick={() => handlePitchCoach(project._id)} disabled={aiLoading}>
              AI Pitch Coach
            </button>
            {pitchCoach[project._id]?.score ? (
              <p className="muted">
                Pitch score: {pitchCoach[project._id].score}/100
                {(pitchCoach[project._id].suggestions || []).length
                  ? ` · ${pitchCoach[project._id].suggestions.join(' | ')}`
                  : ''}
              </p>
            ) : null}
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
              <button type="button" onClick={() => handleEvaluationDraft(project)} disabled={aiLoading}>
                AI Draft Feedback
              </button>
              {evaluationDrafts[project._id]?.detailedFeedback ? (
                <p className="muted">AI draft is loaded into the feedback fields.</p>
              ) : null}
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
          ['profile', profileTabLabel],
          ['evaluations', 'Evaluations'],
          ['archive', 'Archive'],
          ['ai', 'AI tools'],
          ...(canUseCommunity ? [['community', 'Community']] : []),
          ['network', 'Network chat'],
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
              {isFaculty || isAlumni ? (
                <section className="panel">
                  <h2>{isFaculty ? 'Post a project' : 'Alumni posting hub'}</h2>
                  {isAlumni ? (
                    <p className="muted">Publish company job posts or masters projects from your university.</p>
                  ) : null}
                  <form className="stack" onSubmit={handleCreateProject}>
                    <button type="button" onClick={handleProjectAssist} disabled={aiLoading}>
                      AI Suggest Skills/Tags
                    </button>
                    {isAlumni ? (
                      <div className="two-col">
                        <label>
                          Post type
                          <select
                            value={projectForm.postKind}
                            onChange={(event) =>
                              setProjectForm((prev) => ({ ...prev, postKind: event.target.value }))
                            }
                          >
                            <option value="job">Job post from your company</option>
                            <option value="masters_project">Masters project from your university</option>
                          </select>
                        </label>
                        {projectForm.postKind === 'job' ? (
                          <label>
                            Company name
                            <input
                              placeholder="Enter your company"
                              value={projectForm.companyName}
                              onChange={(event) =>
                                setProjectForm((prev) => ({ ...prev, companyName: event.target.value }))
                              }
                              required
                            />
                          </label>
                        ) : (
                          <label>
                            University name
                            <input
                              placeholder="Enter your university"
                              value={projectForm.universityName}
                              onChange={(event) =>
                                setProjectForm((prev) => ({ ...prev, universityName: event.target.value }))
                              }
                              required
                            />
                          </label>
                        )}
                      </div>
                    ) : null}
                    {!isAlumni ? (
                      <div className="two-col">
                        <label>
                          Post type
                          <select
                            value={projectForm.postKind}
                            onChange={(event) =>
                              setProjectForm((prev) => ({ ...prev, postKind: event.target.value }))
                            }
                          >
                            <option value="project">Academic project</option>
                            <option value="job">Job post from your company</option>
                          </select>
                        </label>
                        <label>
                          Company name
                          <input
                            placeholder="Enter your company"
                            value={projectForm.companyName}
                            onChange={(event) =>
                              setProjectForm((prev) => ({ ...prev, companyName: event.target.value }))
                            }
                            required={projectForm.postKind === 'job'}
                          />
                        </label>
                      </div>
                    ) : null}
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
                        Photo / attachment
                        <input
                          ref={projectAttachmentInputRef}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
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
                      {loading ? 'Posting...' : isAlumni ? 'Publish alumni post' : 'Publish project'}
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
                  <span>{filteredActiveProjects.length} visible to everyone</span>
                </div>
                <div className="two-col">
                  <input
                    placeholder="Search projects by title, skill, tag, company..."
                    value={projectSearch}
                    onChange={(event) => setProjectSearch(event.target.value)}
                  />
                  <select value={projectKindFilter} onChange={(event) => setProjectKindFilter(event.target.value)}>
                    <option value="all">All posts</option>
                    <option value="project">Projects</option>
                    <option value="job">Job posts</option>
                    <option value="masters_project">Masters projects</option>
                    <option value="alumni">Alumni posts</option>
                  </select>
                </div>
                <div className="stack">
                  {filteredActiveProjects.length === 0 ? <p className="muted">No matching projects found.</p> : null}
                  {filteredActiveProjects.map((project) => renderProjectCard(project))}
                </div>
              </section>
            </>
          ) : null}

          {activeTab === 'profile' ? (
            <section className="panel profile-panel">
              <div className="profile-hero">
                <div>
                  <p className="eyebrow">{profileHeroLabel}</p>
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
                <div className="button-row">
                  <button type="button" onClick={handleProfileExtract} disabled={aiLoading}>
                    AI Extract Profile Fields
                  </button>
                  <button type="button" onClick={handleVerificationScore} disabled={aiLoading}>
                    AI Verification Score
                  </button>
                </div>
                {verificationInsight ? (
                  <p className="muted">
                    Confidence: {verificationInsight.confidence || 0}% · {verificationInsight.notes || ''}
                  </p>
                ) : null}
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

          {activeTab === 'ai' ? (
            <section className="panel stack">
              {isFaculty ? (
                <>
                  <h2>AI Faculty Toolkit</h2>
                  <p className="muted">Faculty AI focuses on selection, evaluation, and archived insights.</p>
                  <label>
                    Target project
                    <select value={facultyAiProjectId} onChange={(event) => setFacultyAiProjectId(event.target.value)}>
                      <option value="">Select project</option>
                      {activeProjects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="button-row">
                    <button type="button" onClick={handleFacultyEvaluationDraft} disabled={aiLoading}>
                      Draft evaluation narrative
                    </button>
                    <button type="button" onClick={handleArchiveInsightsRefresh} disabled={aiLoading}>
                      Refresh archive insights
                    </button>
                  </div>
                  {facultyEvaluationDraft?.detailedFeedback ? (
                    <div className="soft-panel">
                      <h4>Drafted evaluation</h4>
                      <p>{facultyEvaluationDraft.detailedFeedback}</p>
                      <p className="muted">{facultyEvaluationDraft.futureProspects || ''}</p>
                    </div>
                  ) : null}
                  {archiveInsights.length > 0 ? (
                    <div className="soft-panel">
                      <h4>Archived project insights</h4>
                      {archiveInsights.map((item) => (
                        <p key={item._id}>
                          <strong>{item.title}:</strong> {item.archivedInsights || 'No insights stored yet.'}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <h2>AI Resume + Interview Toolkit</h2>
                  <label>
                    Resume/Profile text
                    <textarea
                      rows={4}
                      placeholder="Paste resume text for keyword scan / ATS checks"
                      value={resumeScanText}
                      onChange={(event) => setResumeScanText(event.target.value)}
                    />
                  </label>
                  <label>
                    Faculty keyword scanner
                    <input
                      placeholder="react, node, leadership, testing"
                      value={resumeKeywords}
                      onChange={(event) => setResumeKeywords(event.target.value)}
                    />
                  </label>
                  <div className="button-row">
                    <button type="button" onClick={handleResumeKeywordScan} disabled={aiLoading}>
                      Scan keywords
                    </button>
                    <button type="button" onClick={handleAtsScore} disabled={aiLoading}>
                      ATS score and chance
                    </button>
                    <button type="button" onClick={handleSkillGap} disabled={aiLoading}>
                      Skill gap detector
                    </button>
                  </div>
                  <div className="two-col">
                    <label>
                      ATS target project
                      <select value={atsProjectId} onChange={(event) => setAtsProjectId(event.target.value)}>
                        <option value="">Select project</option>
                        {activeProjects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Skill-gap target project
                      <select value={skillGapProjectId} onChange={(event) => setSkillGapProjectId(event.target.value)}>
                        <option value="">Select project</option>
                        {activeProjects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {resumeScanResult ? (
                    <p className="muted">
                      Keyword match: {resumeScanResult.matchPercent || 0}% · Missing: {(resumeScanResult.missing || []).join(', ') || 'None'}
                    </p>
                  ) : null}
                  {atsResult ? (
                    <p className="muted">
                      ATS score: {atsResult.atsScore || 0}% · Chance: {atsResult.chanceBand || 'Unknown'} · Missing skills:{' '}
                      {(atsResult.missingSkills || []).join(', ') || 'None'}
                    </p>
                  ) : null}
                  {skillGapResult ? (
                    <p className="muted">
                      Skill gaps: {(skillGapResult.missing || []).join(', ') || 'None'} · Plan:{' '}
                      {(skillGapResult.learningPlan || []).join(' | ') || 'No gap plan needed'}
                    </p>
                  ) : null}
                </>
              )}

            </section>
          ) : null}

          {activeTab === 'community' && canUseCommunity ? (
            <section className="panel stack">
              <div className="section-head">
                <h2>Community (Reddit style)</h2>
                <button type="button" onClick={loadCommunity} disabled={loading}>
                  Refresh community
                </button>
              </div>
              <div className="soft-panel stack">
                <h4>Create a post</h4>
                <input
                  placeholder="Post title"
                  value={communityTitle}
                  onChange={(event) => setCommunityTitle(event.target.value)}
                />
                <textarea
                  rows={3}
                  placeholder="Share your question, update, or experience..."
                  value={communityBody}
                  onChange={(event) => setCommunityBody(event.target.value)}
                />
                <button type="button" className="primary" onClick={handleCreateCommunityPost} disabled={loading}>
                  Publish post
                </button>
              </div>
              <div className="stack">
                {communityPosts.length === 0 ? <p className="muted">No community posts yet.</p> : null}
                {communityPosts.map((post) => (
                  <article key={post._id} className="project-card">
                    <div className="card-topline">
                      <span className="badge">{post.author?.role || 'member'}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p className="muted">By {post.author?.name || 'Community member'}</p>
                    <p>{post.body}</p>
                    <div className="soft-panel">
                      <h4>Comments</h4>
                      {(post.comments || []).length === 0 ? <p className="muted">No comments yet.</p> : null}
                      {(post.comments || []).map((comment, index) => (
                        <p key={`${post._id}-comment-${index}`}>
                          <strong>{comment.author?.name || 'Member'}:</strong> {comment.text}
                        </p>
                      ))}
                      <div className="composer">
                        <textarea
                          rows={2}
                          placeholder="Add a comment..."
                          value={communityCommentDrafts[post._id] || ''}
                          onChange={(event) =>
                            setCommunityCommentDrafts((prev) => ({ ...prev, [post._id]: event.target.value }))
                          }
                        />
                        <button type="button" onClick={() => handleCommunityComment(post._id)} disabled={loading}>
                          Comment
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === 'network' ? (
            <section className="panel stack">
              <div className="section-head">
                <h2>Follow Requests + Chat</h2>
                <button type="button" onClick={loadNetwork} disabled={loading}>
                  Refresh network
                </button>
              </div>

              <div className="soft-panel">
                <h4>Incoming follow requests</h4>
                {incomingRequests.length === 0 ? <p className="muted">No pending requests.</p> : null}
                {incomingRequests.map((requester) => (
                  <div key={requester._id} className="button-row">
                    <span>
                      {requester.name} ({requester.role})
                    </span>
                    <button type="button" onClick={() => handleFollowRespond(requester._id, 'accept')} disabled={loading}>
                      Accept
                    </button>
                    <button type="button" onClick={() => handleFollowRespond(requester._id, 'reject')} disabled={loading}>
                      Reject
                    </button>
                  </div>
                ))}
              </div>

              <div className="soft-panel">
                <h4>People</h4>
                <input
                  placeholder="Search people by name, role, or status..."
                  value={peopleSearch}
                  onChange={(event) => setPeopleSearch(event.target.value)}
                />
                {filteredNetworkUsers.map((person) => (
                  <div key={person._id} className="button-row">
                    <span>
                      {person.name} ({person.role}) - {person.status}
                    </span>
                    {person.status === 'none' || person.status === 'follows_you' ? (
                      <button type="button" onClick={() => handleFollowRequest(person._id)} disabled={loading}>
                        Send follow request
                      </button>
                    ) : null}
                    {person.status === 'connected' ? (
                      <button type="button" onClick={() => loadChat(person._id)} disabled={loading}>
                        Open chat
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              {activeChatUserId ? (
                <div className="soft-panel">
                  <h4>Chat window</h4>
                  <div className="discussion-list">
                    {chatMessages.length === 0 ? <p className="muted">No messages yet.</p> : null}
                    {chatMessages.map((entry, index) => (
                      <p key={`${entry._id || 'msg'}-${index}`}>
                        <strong>{entry.sender?.name || 'You'}:</strong> {entry.text}
                      </p>
                    ))}
                  </div>
                  <div className="composer">
                    <textarea
                      rows={2}
                      placeholder="Type message..."
                      value={chatDraft}
                      onChange={(event) => setChatDraft(event.target.value)}
                    />
                    <button type="button" onClick={sendChatMessage} disabled={loading}>
                      Send
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </section>
      </section>

      {message ? <div className="message-float">{message}</div> : null}
    </main>
  );
}

export default App;
