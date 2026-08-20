// mathlab/types.ts — shared across the whole avatar-teacher pipeline

export type Gesture = "point_left" | "point_right" | "open_palms" | "idle";

export type WhiteboardActionType =
  | "write_equation"
  | "highlight"
  | "plot_graph"
  | "circle_answer"
  | "clear";

export interface WhiteboardAction {
  type: WhiteboardActionType;
  latex?: string | null;
  target?: string | null;
  graphFn?: string | null; // e.g. "x^2 - 4" for plot_graph
}

export interface LessonStep {
  id: number;
  spokenText: string;
  whiteboardAction: WhiteboardAction;
  gesture: Gesture;
  startTime?: number; // seconds, filled in after audio duration is known
  endTime?: number;
}

export interface LessonScript {
  topic: string;
  grade: number;
  steps: LessonStep[];
}

export interface AvatarProfile {
  userId: string;
  sourcePhotoUrl: string;     // uploaded photo, stored once
  provider: "d-id" | "faceMeshFallback";
  faceValidated: boolean;
}

export interface GeneratedAvatarVideo {
  videoUrl: string;
  durationSeconds: number;
  provider: "d-id";
}
