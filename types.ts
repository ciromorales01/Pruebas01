
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: Array<{ title: string; uri: string }>;
}

export interface KnowledgeItem {
  id: string;
  content: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  uploadDate: string;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
}

export interface AppSettings {
  welcomeMessageEs: string;
  welcomeMessageEn: string;
  systemInstruction: string;
  temperature: number;
  historyLimit: number;
  ragLimit: number;
  model: string;
}

export interface AppState {
  messages: Message[];
  knowledgeBase: KnowledgeItem[];
  admins: AdminUser[];
  isThinking: boolean;
  loggedInUser: string | null;
}
