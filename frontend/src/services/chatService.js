import api from './api';

export const chatService = {
  /**
   * Stream question to backend and receive real-time citations and token chunks
   */
  async sendMessageStream({ repositoryId, question, conversationId, onCitations, onToken, onDone, onError, signal }) {
    try {
      const token = localStorage.getItem('repolens_token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/repositories/${repositoryId}/chat`, {
        method: 'POST',
        headers,
        credentials: 'include',
        signal,
        body: JSON.stringify({
          question,
          conversationId,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') {
            if (onDone) onDone();
            return;
          }

          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'citations') {
              if (onCitations) onCitations(data.citations, data.conversationId);
            } else if (data.type === 'token') {
              if (onToken) onToken(data.token);
            } else if (data.type === 'done') {
              if (onDone) onDone(data);
            } else if (data.type === 'error') {
              if (onError) onError(new Error(data.error));
            }
          } catch (e) {
            // Fragment parse error
          }
        }
      }
    } catch (err) {
      if (onError) onError(err);
      throw err;
    }
  },

  async listConversations(repositoryId) {
    const { data } = await api.get(`/api/repositories/${repositoryId}/conversations`);
    return data.conversations;
  },

  async getConversation(id) {
    const { data } = await api.get(`/api/conversations/${id}`);
    return data.conversation;
  },

  async deleteConversation(id) {
    const { data } = await api.delete(`/api/conversations/${id}`);
    return data;
  },
};
