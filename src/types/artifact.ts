export type TimelineStep = {
  code: string;
  label: string;
};

export type Artifact = {
  id: string;
  title: string;
  commonName: string;
  category: string;
  classification: string;
  capturePoint: string;
  origin: string;
  material: string;
  condition: string;
  continuityScore: number;
  preservationState: string;
  essence: string;
  stage: string;
  image: string | null;
  timeline: TimelineStep[];
};
