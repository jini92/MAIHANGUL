import { locales, type Concept, type ContentMode, type ContentPack, type ValidationIssue } from './types';

type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const positive = (value: unknown): value is number => Number.isInteger(value) && Number(value) > 0;
const date = (value: unknown): boolean => text(value) && Number.isFinite(Date.parse(value));

export interface ValidationOptions {
  mode?: ContentMode;
  /** IDs must be drawn from the checked-in rights ledger, never from content itself. */
  rightsRecordIds?: readonly string[];
  /** Optional media is denied unless explicitly supplied by a reviewed asset manifest. */
  approvedMediaIds?: readonly string[];
}

export function validateContentPack(value: unknown, options: ValidationOptions = {}): {
  pack: ContentPack | null;
  concepts: Concept[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const mode = options.mode ?? 'release';
  const rights = new Set(options.rightsRecordIds ?? []);
  const media = new Set(options.approvedMediaIds ?? []);
  const add = (path: string, message: string, code: ValidationIssue['code'] = 'structure') => issues.push({ path, code, message });
  const required = (v: unknown, path: string) => { if (!text(v)) add(path, 'Required nonempty text.'); };
  const translated = (v: unknown, path: string, allowEmpty = false) => {
    if (!object(v)) { add(path, 'Expected ko, en and vi text.'); return; }
    for (const locale of locales) {
      if (typeof v[locale] !== 'string' || (!allowEmpty && !text(v[locale]))) add(`${path}.${locale}`, 'Missing localized text.');
    }
  };
  if (!object(value)) { add('$', 'Expected a content pack.'); return { pack: null, concepts: [], issues }; }
  if (value.schemaVersion !== 1) add('schemaVersion', 'Unsupported content schema.', 'version');
  if (!text(value.packId) || !/^MH-[A-Z]+-\d{2}$/.test(value.packId)) add('packId', 'Invalid pack ID.');
  if (!(value.packVersion === null || (text(value.packVersion) && /^\d+\.\d+\.\d+$/.test(value.packVersion)))) add('packVersion', 'Expected a semantic version or null.');
  if (mode === 'release' && value.packVersion === null) add('packVersion', 'Release requires a reviewed pack version.', 'version');
  if (!Array.isArray(value.concepts) || value.concepts.length === 0) add('concepts', 'Expected a nonempty concept list.');
  const structuralPackError = issues.some((issue) => issue.code !== 'version' || issue.path === 'schemaVersion');
  if (structuralPackError || !Array.isArray(value.concepts)) return { pack: null, concepts: [], issues };

  const ids = new Set<string>();
  const stageOrders = new Set<string>();
  let duplicate = false;
  const validConcepts: Concept[] = [];
  value.concepts.forEach((candidate, index) => {
    const base = `concepts[${index}]`;
    const issueStart = issues.length;
    if (!object(candidate)) { add(base, 'Expected a concept object.'); return; }
    const c = candidate;
    if (!text(c.id) || !/^MH-C\d{3}$/.test(c.id)) add(`${base}.id`, 'Invalid concept ID.');
    else if (ids.has(c.id)) { duplicate = true; add(`${base}.id`, 'Duplicate concept ID.', 'duplicate'); }
    else ids.add(c.id);
    if (!positive(c.revision)) add(`${base}.revision`, 'Expected a positive content revision.');
    if (!['jamo', 'word', 'daily', 'cafe'].includes(String(c.stage))) add(`${base}.stage`, 'Unknown learning stage.');
    if (!positive(c.order)) add(`${base}.order`, 'Expected a positive stage order.');
    const stageOrder = `${c.stage}:${c.order}`;
    if (stageOrders.has(stageOrder)) { duplicate = true; add(`${base}.order`, 'Duplicate stage order.', 'duplicate'); }
    stageOrders.add(stageOrder);
    required(c.learningGoal, `${base}.learningGoal`);
    required(c.difficultyNote, `${base}.difficultyNote`);
    if (!['active', 'quarantined', 'retired'].includes(String(c.lifecycle))) add(`${base}.lifecycle`, 'Unknown lifecycle.');
    if (!object(c.provenance)) add(`${base}.provenance`, 'Missing provenance.');
    else {
      const p = c.provenance;
      if (!['original', 'adapted', 'licensed'].includes(String(p.origin))) add(`${base}.provenance.origin`, 'Unknown origin.');
      required(p.createdBy, `${base}.provenance.createdBy`);
      if (!date(p.createdAt)) add(`${base}.provenance.createdAt`, 'Invalid creation date.');
      if (!Array.isArray(p.sourceReferences)) add(`${base}.provenance.sourceReferences`, 'Expected a source list.');
      else p.sourceReferences.forEach((source, i) => {
        if (!object(source)) { add(`${base}.provenance.sourceReferences[${i}]`, 'Invalid source.'); return; }
        for (const field of ['title', 'url', 'scope']) required(source[field], `${base}.provenance.sourceReferences[${i}].${field}`);
        if (!date(source.accessedAt)) add(`${base}.provenance.sourceReferences[${i}].accessedAt`, 'Invalid access date.');
      });
      if (!Array.isArray(p.assetRecordIds) || p.assetRecordIds.length === 0) add(`${base}.provenance.assetRecordIds`, 'Missing rights ledger reference.', 'rights');
      else for (const id of p.assetRecordIds) if (!text(id) || !rights.has(id)) add(`${base}.provenance.assetRecordIds`, 'Unknown rights ledger reference.', 'rights');
    }
    if (!object(c.review)) add(`${base}.review`, 'Missing review records.', 'review');
    else for (const area of ['education', 'ko', 'en', 'vi', 'rights']) {
      const record = c.review[area];
      const path = `${base}.review.${area}`;
      if (!object(record)) { add(path, 'Missing review area.', 'review'); continue; }
      if (!['draft', 'inReview', 'approved', 'rejected', 'needsRecheck'].includes(String(record.status))) add(`${path}.status`, 'Invalid review status.', 'review');
      required(record.scope, `${path}.scope`);
      if (typeof record.notes !== 'string') add(`${path}.notes`, 'Missing review notes.', 'review');
      for (const field of ['reviewer', 'reviewedAt', 'evidence']) if (!(record[field] === null || text(record[field]))) add(`${path}.${field}`, 'Expected text or null.', 'review');
      if (record.status === 'approved') {
        if (!text(record.reviewer) || !date(record.reviewedAt) || !text(record.evidence)) add(path, 'Approval requires reviewer, date and evidence.', 'review');
        // Scope starts with exact identity and area tokens; optional notes follow a semicolon.
        const scope = text(record.scope) ? /^(\S+)\s+(education|ko|en|vi|rights)(?:\s*;.*)?$/.exec(record.scope) : null;
        if (!scope || scope[1] !== `${c.id}@${c.revision}` || scope[2] !== area) add(`${path}.scope`, 'Approval must identify the exact concept, revision and review area.', 'review');
      }
      if (record.status === 'rejected' || (area === 'rights' && record.status === 'needsRecheck')) add(path, 'Content is on review/rights hold.', area === 'rights' ? 'rights' : 'review');
      if (mode === 'release' && record.status !== 'approved') add(path, 'Release requires every review area approved.', 'review');
    }
    if (!object(c.variants)) add(`${base}.variants`, 'Missing practice variants.');
    else for (const locale of locales) {
      const v = c.variants[locale];
      const path = `${base}.variants.${locale}`;
      if (!object(v)) { add(path, 'Missing practice variant.'); continue; }
      if (v.practiceLanguage !== locale) add(`${path}.practiceLanguage`, 'Variant language does not match its key.');
      required(v.targetText, `${path}.targetText`);
      if (typeof v.targetText === 'string' && (v.targetText.normalize('NFC') !== v.targetText || /^ | $/.test(v.targetText) || /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(v.targetText))) add(`${path}.targetText`, 'Use NFC single-line text without edge spaces or invisible controls.');
      translated(v.explanations, `${path}.explanations`);
      translated(v.usageNote, `${path}.usageNote`, true);
      if (v.keyboardHint !== null) translated(v.keyboardHint, `${path}.keyboardHint`);
      if (c.stage === 'jamo' && v.keyboardHint === null) add(`${path}.keyboardHint`, 'Jamo requires a keyboard hint.');
      if (v.audioRef !== null && (!text(v.audioRef) || !media.has(v.audioRef))) add(`${path}.audioRef`, 'Audio has no approved asset manifest entry.', 'media');
      if (c.stage === 'jamo') {
        if (v.meaningTask !== null) add(`${path}.meaningTask`, 'Jamo has no meaning score.');
        continue;
      }
      if (!object(v.meaningTask)) { add(`${path}.meaningTask`, 'This stage requires a meaning task.'); continue; }
      const m = v.meaningTask;
      const mp = `${path}.meaningTask`;
      if (m.kind !== (c.stage === 'cafe' ? 'selectOrder' : 'selectMeaning')) add(`${mp}.kind`, 'Meaning task kind does not match stage.');
      translated(m.instruction, `${mp}.instruction`);
      translated(m.feedback, `${mp}.feedback`);
      const optionIds = new Set<string>();
      if (!Array.isArray(m.options) || m.options.length !== 3) add(`${mp}.options`, 'Expected exactly three options.');
      if (Array.isArray(m.options)) m.options.forEach((option, oi) => {
        const op = `${mp}.options[${oi}]`;
        if (!object(option)) { add(op, 'Expected an option.'); return; }
        if (!text(option.id) || optionIds.has(option.id)) add(`${op}.id`, 'Option ID missing or duplicated.');
        else optionIds.add(option.id);
        translated(option.label, `${op}.label`);
        if (option.imageRef !== null && option.imageRef !== undefined && (!text(option.imageRef) || !media.has(option.imageRef))) add(`${op}.imageRef`, 'Image has no approved asset manifest entry.', 'media');
        if (!object(m.feedbackByOptionId)) add(`${mp}.feedbackByOptionId`, 'Missing per-option feedback.');
        else translated(m.feedbackByOptionId[String(option.id)], `${mp}.feedbackByOptionId.${option.id}`);
        if ('correct' in option || 'isCorrect' in option) add(op, 'Use one correctOptionId, never per-option answers.');
      });
      if (!text(m.correctOptionId) || !optionIds.has(m.correctOptionId)) add(`${mp}.correctOptionId`, 'Correct answer must identify exactly one existing option.');
      if (Array.isArray(m.correctOptionIds)) add(`${mp}.correctOptionIds`, 'Multiple answer IDs are unsupported.');
      if (object(m.feedbackByOptionId) && Object.keys(m.feedbackByOptionId).some((id) => !optionIds.has(id))) add(`${mp}.feedbackByOptionId`, 'Feedback references an unknown option.');
      if (c.stage === 'cafe') {
        if (!object(m.orderAttributes) || !text(m.orderAttributes.drink)) add(`${mp}.orderAttributes`, 'Cafe needs explicit drink attributes.');
        else {
          if (m.orderAttributes.quantity !== undefined && !positive(m.orderAttributes.quantity)) add(`${mp}.orderAttributes.quantity`, 'Invalid order quantity.');
          if (m.orderAttributes.temperature !== undefined && !text(m.orderAttributes.temperature)) add(`${mp}.orderAttributes.temperature`, 'Invalid temperature.');
        }
      } else if (m.orderAttributes !== null) add(`${mp}.orderAttributes`, 'Non-cafe tasks have null order attributes.');
    }
    if (issues.length === issueStart && c.lifecycle === 'active') validConcepts.push(c as unknown as Concept);
  });
  const pack = value as unknown as ContentPack;
  return { pack, concepts: duplicate || (mode === 'release' && pack.packVersion === null) ? [] : validConcepts, issues };
}
