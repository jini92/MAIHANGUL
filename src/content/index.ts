import rawPack from '../../content/core-draft.json';
import { validateContentPack } from './validate';
import type { ContentMode, ContentPack } from './types';

export * from './types';
export { validateContentPack } from './validate';

/** These IDs link to the local ASSET-LICENSES ledger; none is a release approval. */
export const draftRightsRecordIds = ['MH-R001-TEXT', 'MH-R002-TRANSLATION'] as const;
export const draftPack = rawPack as ContentPack;

export function loadContent(mode: ContentMode = 'release') {
  const result = validateContentPack(rawPack, { mode, rightsRecordIds: draftRightsRecordIds });
  return { ...result, pack: result.pack ?? draftPack, mode };
}
