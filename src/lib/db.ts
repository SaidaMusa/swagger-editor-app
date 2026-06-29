import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  savedSchema?: string;
  createdAt: string;
};

export type HistoryRecord = {
  id: string;
  userId: string;
  method: string;
  endpoint: string;
  url: string;
  responseStatus: number;
  requestTimestamp: string;
  requestDuration: number;
  requestSize: number;
  responseSize: number;
  errorDetails?: string;
};

type Database = {
  users: UserRecord[];
  history: HistoryRecord[];
};

const emptyDb: Database = {
  users: [],
  history: []
};

function dbPath(): string {
  return path.join(process.cwd(), ".data", "db.json");
}

async function readDb(): Promise<Database> {
  try {
    const raw = await readFile(dbPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch {
    return emptyDb;
  }
}

async function writeDb(db: Database): Promise<void> {
  await mkdir(path.dirname(dbPath()), { recursive: true });
  await writeFile(dbPath(), JSON.stringify(db, null, 2), "utf8");
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await readDb();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const db = await readDb();
  return db.users.find((user) => user.id === id) ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<UserRecord> {
  const db = await readDb();
  const user: UserRecord = {
    id: randomUUID(),
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function saveSchema(userId: string, schema: string): Promise<void> {
  const db = await readDb();
  const user = db.users.find((item) => item.id === userId);

  if (user) {
    user.savedSchema = schema;
    await writeDb(db);
  }
}

export async function getSavedSchema(userId: string): Promise<string | null> {
  const user = await findUserById(userId);
  return user?.savedSchema ?? null;
}

export async function addHistory(record: HistoryRecord): Promise<void> {
  const db = await readDb();
  db.history.push(record);
  await writeDb(db);
}

export async function getUserHistory(userId: string): Promise<HistoryRecord[]> {
  const db = await readDb();
  return db.history
    .filter((record) => record.userId === userId)
    .sort(
      (left, right) =>
        new Date(right.requestTimestamp).getTime() - new Date(left.requestTimestamp).getTime()
    );
}

export async function getHistoryItem(userId: string, id: string): Promise<HistoryRecord | null> {
  const history = await getUserHistory(userId);
  return history.find((record) => record.id === id) ?? null;
}
