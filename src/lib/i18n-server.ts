import { cookies } from "next/headers";
import {
  normalizeLanguage,
  translate,
  type Language,
  type TranslationKey
} from "@/lib/translations";

export async function getServerLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const language = cookieStore.get("swagger-language")?.value;

  return normalizeLanguage(language);
}

export async function getServerT(): Promise<(key: TranslationKey) => string> {
  const language = await getServerLanguage();

  return (key: TranslationKey) => translate(language, key);
}
