export interface LegalSection {
  heading: string;
  body: string[];
}

export type LegalPageKey = "terms" | "privacy";

export interface LegalPageContent {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}
