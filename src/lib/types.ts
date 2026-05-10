export interface VoiceProfile {
  summary: string;
  sentenceRhythm: string;
  vocabularyStyle: string;
  dialoguePatterns: string;
  narrativeTone: string;
  distinctiveQuirks: string;
  analyzedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  brief: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  voiceProfile: VoiceProfile | null;
  sampleText: string;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
}
