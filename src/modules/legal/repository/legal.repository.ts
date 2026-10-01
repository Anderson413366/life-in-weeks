import { LEGAL_CONTENT } from "./queries";
import type { LegalPageKey } from "../types/legal.types";

export function getLegalPageRecord(page: LegalPageKey) {
  return LEGAL_CONTENT[page];
}
