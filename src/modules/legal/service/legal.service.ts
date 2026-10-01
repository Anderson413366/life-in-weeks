import { getLegalPageRecord } from "../repository/legal.repository";
import type { LegalPageKey } from "../types/legal.types";

export function getPublicLegalPage(page: LegalPageKey) {
  return getLegalPageRecord(page);
}
