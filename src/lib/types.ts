// Client-facing shapes returned by the API (dates serialized as ISO strings).

export interface CommentDTO {
  id: number;
  body: string;
  author: string;
  createdAt: string;
}

export interface IssueDTO {
  id: number;
  title: string;
  description: string;
  priority: string;
  department: string;
  status: string;
  reportedBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
  comments?: CommentDTO[];
}

export interface IssueStats {
  open: number;
  inProgress: number;
  resolved: number;
  criticalActive: number;
}
