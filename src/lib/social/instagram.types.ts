// ─── Meta Graph API shapes (Instagram container + publish) ─────────────────

export type InstagramGraphError = {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

export type InstagramGraphErrorResponse = {
  error?: InstagramGraphError;
};

export type InstagramMediaContainerResponse = {
  id: string; // creation_id
};

export type InstagramMediaPublishResponse = {
  id: string; // published media id
};

export type InstagramContainerStatusResponse = {
  status_code?: "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";
};

export type InstagramMediaLookupResponse = {
  permalink?: string;
};
