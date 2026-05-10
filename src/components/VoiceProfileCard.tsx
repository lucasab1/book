"use client";
import { VoiceProfile } from "@/lib/types";

interface Props {
  profile: VoiceProfile;
  onReanalyze: () => void;
}

const FIELDS: { key: keyof VoiceProfile; label: string }[] = [
  { key: "summary", label: "Overall voice" },
  { key: "sentenceRhythm", label: "Sentence rhythm" },
  { key: "vocabularyStyle", label: "Vocabulary" },
  { key: "dialoguePatterns", label: "Dialogue" },
  { key: "narrativeTone", label: "Narrative tone" },
  { key: "distinctiveQuirks", label: "Distinctive quirks" },
];

export default function VoiceProfileCard({ profile, onReanalyze }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Voice profile</h2>
        <button
          onClick={onReanalyze}
          style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
          className="text-xs px-4 py-2 rounded hover:opacity-80 transition-opacity"
        >
          Re-analyze
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {FIELDS.map(({ key, label }) => {
          const value = profile[key];
          if (!value || key === "analyzedAt") return null;
          return (
            <div
              key={key}
              style={{ border: "1px solid var(--border)", background: "var(--surface2)" }}
              className="p-4 rounded"
            >
              <p style={{ color: "var(--accent)" }} className="text-xs uppercase tracking-widest mb-2 font-bold">
                {label}
              </p>
              <p className="text-sm leading-relaxed">{value as string}</p>
            </div>
          );
        })}
      </div>
      <p style={{ color: "var(--muted)" }} className="text-xs mt-4">
        Analyzed {new Date(profile.analyzedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
