export interface Environment {
  password?: string;
  username?: string;
  url?: string;
}

export interface Credentials {
  host: string;
  password: string;
  username: string;
  port?: number;
}

export interface JiraResponse {
  issues: JiraIssue[];
}

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    parent: {
      key: string;
    };
  };
}
