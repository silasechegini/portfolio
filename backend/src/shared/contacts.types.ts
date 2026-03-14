export type Contact = {
  id: string;
  name: string;
  email: string;
  subject?: string | undefined;
  message: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  createdAt?: string | undefined;
};

export type ContactList = Contact[];

export type ContactSearchResult = Contact[];
