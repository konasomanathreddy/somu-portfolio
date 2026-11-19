export interface PortfolioProfile {
  brand: string;
  fullName: string;
  role: string;
  university: string;
  year: string;
  location: string;
  email: string;
  githubUrl: string;
  headline: string;
  summary: string;
  availability: string;
}

export interface PortfolioHighlight {
  label: string;
  value: string;
  detail: string;
}

export interface AboutEntry {
  index: string;
  title: string;
  description: string;
}

export interface SkillItem {
  name: string;
  level: string;
  category: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  index: string;
  category: string;
  title: string;
  summary: string;
  details: string;
  stack: string[];
  repoUrl: string;
  imageKey: 'project_one' | 'project_two';
}

export interface EducationInfo {
  degree: string;
  status: string;
  field: string;
  institution: string;
  highlights: string[];
}

export interface PortfolioData {
  profile: PortfolioProfile;
  highlights: PortfolioHighlight[];
  about: AboutEntry[];
  skills: SkillItem[];
  projects: ProjectItem[];
  education: EducationInfo;
}

export interface EnquirySubmissionPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

export interface EnquiryReceipt {
  referenceCode: string;
  name: string;
  email: string;
  subject: string;
  deliveryStatus: string;
  deliveryChannel: string;
  createdAt: string;
}

export interface EnquiryApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  enquiry?: EnquiryReceipt;
  emailSent?: boolean;
  deliveryDetail?: string;
  recipient?: string;
}
