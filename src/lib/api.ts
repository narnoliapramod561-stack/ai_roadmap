const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function for retry logic with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined; // Declare timeoutId outside try-catch
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for AI deep analysis

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId); // Clear timeout on error
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new Error('Request timed out. Please check your connection and try again.');
  }
  throw lastError || new Error('Network error. Please check your connection.');
}

function handleApiError(response: Response): never {
  const status = response.status;
  const statusText = response.statusText;

  if (status === 400 || status === 422) {
    throw new Error('Invalid request. Please check your input.');
  } else if (status === 404) {
    throw new Error('Resource not found. Please try again.');
  } else if (status === 500 || status === 502 || status === 503) {
    // If it's a 500 but we have a more specific message, it's handled in the caller's try-catch (uploadMaterial)
    // Here we provide a general fallback
    throw new Error('Server error: The AI or Database service encountered an issue. Please try again later.');
  } else if (status === 0) {
    throw new Error('Cannot reach the server. Please check if the backend is running.');
  } else {
    throw new Error(`Error ${status}: ${statusText}`);
  }
}

export const api = {
  async uploadMaterial(file: File, userId?: string, subjectName: string = '', examDate?: string, userEmail?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (userId) formData.append('user_id', userId);
    if (userEmail) formData.append('user_email', userEmail);
    formData.append('subject_name', subjectName);
    if (examDate) formData.append('exam_date', examDate);

    const response = await fetchWithRetry(`${API_BASE_URL}/materials/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload material');
      } catch {
        handleApiError(response);
      }
    }

    return response.json().catch(() => {
      throw new Error('Invalid response from server');
    });
  },

  async listMaterials(userId?: string) {
    const url = userId ? `${API_BASE_URL}/materials/?user_id=${userId}` : `${API_BASE_URL}/materials/`;
    const response = await fetchWithRetry(url);
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  async deleteMaterial(materialId: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/materials/${materialId}`, {
      method: 'DELETE',
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  async getRoadmap(materialId: string, userId?: string) {
    const url = new URL(`${API_BASE_URL}/study/roadmap/${materialId}`);
    if (userId) url.searchParams.append('user_id', userId);

    const response = await fetchWithRetry(url.toString());
    if (!response.ok) handleApiError(response);

    return response.json().catch(() => {
      throw new Error('Invalid response from server');
    });
  },

  async generateQuiz(topicId: string, count: number = 5, difficulty: string = 'medium', topicLabel?: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, topic_label: topicLabel, count, difficulty }),
    });

    if (!response.ok) handleApiError(response);

    return response.json().catch(() => {
      throw new Error('Invalid response from server');
    });
  },

  async submitQuiz(quizId: string, userAnswers: number[], topicId: string, userId?: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz_id: quizId,
        user_answers: userAnswers,
        topic_id: topicId,
        user_id: userId,
      }),
    });

    if (!response.ok) handleApiError(response);

    return response.json().catch(() => {
      throw new Error('Invalid response from server');
    });
  },

  async gradeHandwritten(file: File, question: string, topic: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', question);
    formData.append('topic', topic);

    const response = await fetchWithRetry(`${API_BASE_URL}/grader/handwritten`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to grade handwritten answer');
      } catch {
        handleApiError(response);
      }
    }

    return response.json().catch(() => {
      throw new Error('Invalid response from server');
    });
  },

  async chatWithTutor(message: string, context: string = '') {
    const response = await fetchWithRetry(`${API_BASE_URL}/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) handleApiError(response);

    return response.json().catch(() => {
      throw new Error('Invalid response from server');
    });
  },

  async generatePlanner(userId: string, timeframe: string = 'daily', examDate?: string, studyIntervals?: any[], materialIds?: string[], syllabusTopicsOverride?: string[], subjectNamesOverride?: string[]) {
    const response = await fetchWithRetry(`${API_BASE_URL}/study/generate-planner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        timeframe,
        exam_date: examDate,
        study_intervals: studyIntervals,
        material_ids: materialIds,
        syllabus_topics_override: syllabusTopicsOverride && syllabusTopicsOverride.length > 0 ? syllabusTopicsOverride : undefined,
        subject_names_override: subjectNamesOverride && subjectNamesOverride.length > 0 ? subjectNamesOverride : undefined
      }),
    });

    if (!response.ok) handleApiError(response);

    return response.json();
  },

  async getPlanner(userId: string, timeframe: string = 'daily') {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/study/planner?user_id=${userId}&timeframe=${timeframe}`
    );

    if (!response.ok) handleApiError(response);

    return response.json();
  },

  async toggleTaskStatus(taskId: string, isCompleted: boolean) {
    const response = await fetchWithRetry(`${API_BASE_URL}/study/planner/task/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: isCompleted }),
    });

    if (!response.ok) handleApiError(response);

    return response.json();
  },

  // ── Readiness Score ───────────────────────────────────
  async getReadinessScore(userId: string, materialId?: string) {
    const url = new URL(`${API_BASE_URL}/readiness/score`);
    url.searchParams.set('user_id', userId);
    if (materialId) url.searchParams.set('material_id', materialId);
    const response = await fetchWithRetry(url.toString());
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  // ── Quiz History ──────────────────────────────────────
  async getQuizHistory(userId: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/quiz/history?user_id=${userId}`);
    if (!response.ok) return [];
    return response.json();
  },

  async generateQuizFull(topicId: string, topicLabel: string, materialId?: string, userId?: string, count = 5, difficulty = 'medium') {
    const response = await fetchWithRetry(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, topic_label: topicLabel, material_id: materialId, user_id: userId, count, difficulty }),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  async submitQuizFull(quizId: string, userAnswers: number[], topicId: string, topicName: string, userId?: string, difficulty?: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quizId, user_answers: userAnswers, topic_id: topicId, topic_name: topicName, user_id: userId, difficulty }),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  // ── Spaced Repetition ─────────────────────────────────
  async updateMastery(topicId: string, quality: number, userId?: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/spaced-repetition/update-mastery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        topic_id: topicId,
        quality: quality,
        user_id: userId
      })
    })
    if (!response.ok) handleApiError(response)
    return response.json()
  },

  async getSpacedRepetitionQueue(userId: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/spaced-repetition/queue?user_id=${userId}`);
    if (!response.ok) return { queue: [] };
    return response.json();
  },

  async getOverdueTopics(userId: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/spaced-repetition/overdue?user_id=${userId}`);
    if (!response.ok) return { overdue: [] };
    return response.json();
  },

  // ── AI Explain ────────────────────────────────────────
  async explainTopic(topic: string, question: string, materialId?: string, userId?: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, question, material_id: materialId, user_id: userId }),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  // ── Learned Topics (Persistent Progress) ─────────────
  async markTopicLearned(userId: string, topicLabel: string, materialId?: string) {
    const response = await fetchWithRetry(`${API_BASE_URL}/study/mark-learned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, topic_label: topicLabel, material_id: materialId ?? null }),
    });
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  async unlearnTopic(userId: string, topicLabel: string) {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/study/unlearn-topic?user_id=${encodeURIComponent(userId)}&topic_label=${encodeURIComponent(topicLabel)}`,
      { method: 'DELETE' }
    );
    if (!response.ok) handleApiError(response);
    return response.json();
  },

  async getLearnedTopics(userId: string): Promise<{ topic_label: string; material_id?: string; learned_at: string }[]> {
    const response = await fetchWithRetry(`${API_BASE_URL}/study/learned-topics?user_id=${encodeURIComponent(userId)}`);
    if (!response.ok) return [];
    return response.json();
  },
};

