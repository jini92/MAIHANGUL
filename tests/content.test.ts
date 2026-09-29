import { describe, expect, it } from 'vitest';
import { draftPack, draftRightsRecordIds, loadContent, validateContentPack, type ContentPack } from '../src/content';

const copy = () => structuredClone(draftPack);
const preview = (pack: unknown) => validateContentPack(pack, { mode: 'preview', rightsRecordIds: draftRightsRecordIds });

describe('content structure and provision boundary', () => {
  it('loads the original 20 concepts/60 variants only in explicit preview', () => {
    const result = loadContent('preview');
    expect(result.issues).toEqual([]);
    expect(result.concepts).toHaveLength(20);
    expect(result.concepts.flatMap((c) => Object.values(c.variants))).toHaveLength(60);
    expect(result.concepts.reduce((stages, c) => ({ ...stages, [c.stage]: (stages[c.stage] ?? 0) + 1 }), {} as Record<string, number>)).toEqual({ jamo: 4, word: 6, daily: 6, cafe: 4 });
    expect(loadContent().concepts).toEqual([]);
    expect(loadContent('release').issues.some((issue) => issue.code === 'review')).toBe(true);
    for (const c of result.concepts) {
      expect(Object.values(c.review).every((r) => r.status === 'draft' && r.reviewer === null)).toBe(true);
      expect(Object.values(c.variants).every((v) => v.audioRef === null)).toBe(true);
    }
  });

  it('isolates a missing Vietnamese explanation and reports its full path', () => {
    const pack = copy();
    pack.concepts[4].variants.ko.explanations.vi = '';
    const result = preview(pack);
    expect(result.concepts.map((c) => c.id)).not.toContain('MH-C005');
    expect(result.concepts).toHaveLength(19);
    expect(result.issues).toContainEqual(expect.objectContaining({ path: 'concepts[4].variants.ko.explanations.vi' }));
  });

  it('rejects the entire ambiguous pack when concept IDs are duplicated', () => {
    const pack = copy();
    pack.concepts.push(structuredClone(pack.concepts[4]));
    expect(preview(pack).concepts).toEqual([]);
    expect(preview(pack).issues.some((issue) => issue.code === 'duplicate')).toBe(true);
  });

  it('isolates incorrect answer references and duplicated option IDs', () => {
    const pack = copy();
    pack.concepts[4].variants.ko.meaningTask!.correctOptionId = 'missing';
    pack.concepts[5].variants.vi.meaningTask!.options[1].id = pack.concepts[5].variants.vi.meaningTask!.options[0].id;
    const ids = preview(pack).concepts.map((c) => c.id);
    expect(ids).not.toContain('MH-C005');
    expect(ids).not.toContain('MH-C006');
  });

  it('does not accept multiple answer flags or missing per-option feedback', () => {
    const pack = copy();
    Object.assign(pack.concepts[4].variants.ko.meaningTask!.options[0], { isCorrect: true });
    delete pack.concepts[5].variants.vi.meaningTask!.feedbackByOptionId.water;
    expect(preview(pack).concepts.map((c) => c.id)).not.toContain('MH-C005');
    expect(preview(pack).concepts.map((c) => c.id)).not.toContain('MH-C006');
  });

  it('requires known ledger references and blocks explicit rights holds even in preview', () => {
    const pack = copy();
    pack.concepts[4].provenance.assetRecordIds = ['unregistered'];
    pack.concepts[5].review.rights.status = 'needsRecheck';
    expect(preview(pack).concepts).toHaveLength(18);
    expect(preview(pack).issues.filter((issue) => issue.code === 'rights').length).toBeGreaterThanOrEqual(2);
  });

  it('requires evidence attached to an approved exact revision and language', () => {
    const pack = copy();
    pack.packVersion = '1.0.0';
    for (const c of pack.concepts) for (const r of Object.values(c.review)) r.status = 'approved';
    const result = validateContentPack(pack, { mode: 'release', rightsRecordIds: draftRightsRecordIds });
    expect(result.concepts).toEqual([]);
    expect(result.issues.some((issue) => issue.message.includes('reviewer'))).toBe(true);
  });

  it('binds approval to exact concept revision and area tokens', () => {
    const pack = copy();
    pack.concepts = [pack.concepts[4]];
    pack.concepts[0].revision = 1;
    pack.packVersion = '1.0.0';
    for (const [area, record] of Object.entries(pack.concepts[0].review)) {
      Object.assign(record, { status: 'approved', reviewer: 'synthetic unit fixture only', reviewedAt: '2026-09-30', evidence: 'synthetic-fixture.md', scope: `MH-C005@1 ${area}; synthetic fixture` });
    }
    const release = () => validateContentPack(pack, { mode: 'release', rightsRecordIds: draftRightsRecordIds });
    expect(release().concepts).toHaveLength(1);
    pack.concepts[0].review.vi.scope = 'MH-C005@10 vi';
    expect(release().concepts).toHaveLength(0);
    pack.concepts[0].review.vi.scope = 'MH-C005@1 viet';
    expect(release().concepts).toHaveLength(0);
    pack.concepts[0].review.vi.scope = 'MH-C005@1 en';
    expect(release().concepts).toHaveLength(0);
    pack.concepts[0].review.vi.scope = 'MH-C005@1 vi';
    expect(release().concepts).toHaveLength(1);
  });

  it('shows language-appropriate keyboard guidance for the English and Vietnamese jamo variants', () => {
    for (const concept of draftPack.concepts.slice(0, 4)) {
      expect(concept.variants.ko.keyboardHint?.ko).toContain('두벌식');
      expect(concept.variants.en.keyboardHint?.en).toContain('English input');
      expect(concept.variants.en.keyboardHint?.ko).not.toContain('두벌식');
      expect(concept.variants.vi.keyboardHint?.vi).toContain('Telex');
      expect(concept.variants.vi.keyboardHint?.vi).toContain('VNI');
      expect(concept.variants.vi.keyboardHint?.ko).toContain('성조');
    }
  });

  it('separates Korean option labels from particles in wrong-answer feedback', () => {
    const water = draftPack.concepts.find((c) => c.id === 'MH-C005')!;
    expect(water.variants.ko.meaningTask!.feedbackByOptionId.milk.ko).toBe('선택한 보기: 우유. 이 문제의 뜻: 물.');
    const school = draftPack.concepts.find((c) => c.id === 'MH-C010')!;
    expect(school.variants.vi.meaningTask!.feedbackByOptionId.home.ko).toBe('선택한 보기: 집. 이 문제의 뜻: 학교.');
    expect(draftPack.concepts.every((c) => c.revision === 2 && Object.values(c.review).every((r) => r.status === 'draft'))).toBe(true);
  });

  it('keeps native input targets NFC and preserves accents instead of silently rewriting them', () => {
    const pack = copy();
    pack.concepts[5].variants.vi.targetText = 'ca\u0300 phe\u0302';
    pack.concepts[6].variants.en.targetText = ' milk';
    pack.concepts[7].variants.ko.targetText = '컵\u200b';
    const result = preview(pack);
    expect(result.concepts).toHaveLength(17);
    expect(result.issues.filter((issue) => issue.path.endsWith('targetText'))).toHaveLength(3);
  });

  it('does not introduce a meaning denominator for jamo and excludes quarantined concepts', () => {
    const pack = copy();
    expect(pack.concepts.slice(0, 4).every((c) => Object.values(c.variants).every((v) => v.meaningTask === null))).toBe(true);
    pack.concepts[0].lifecycle = 'quarantined';
    pack.concepts[4].variants.en.meaningTask = null;
    expect(preview(pack).concepts).toHaveLength(18);
  });

  it('rejects unsupported schemas and denies unapproved optional media', () => {
    const pack = copy();
    expect(preview({ ...pack, schemaVersion: 2 }).pack).toBeNull();
    pack.concepts[4].variants.ko.audioRef = 'https://unreviewed.example/audio';
    expect(preview(pack).concepts).toHaveLength(19);
  });

  it('keeps content revision and pack version separate', () => {
    const pack: ContentPack = copy();
    pack.concepts[4].revision = 3;
    expect(preview(pack).concepts.find((c) => c.id === 'MH-C005')?.revision).toBe(3);
    expect(preview(pack).pack?.packVersion).toBeNull();
  });
});
