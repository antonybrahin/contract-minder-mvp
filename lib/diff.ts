import { diff_match_patch, Diff } from 'diff-match-patch';

export type SideBySideDiffSegment = {
  type: 'equal' | 'insert' | 'delete' | 'replace';
  leftText: string;
  rightText: string;
};

export function createSideBySideDiff(oldText: string, newText: string): SideBySideDiffSegment[] {
  const dmp = new diff_match_patch();
  const diffs: Diff[] = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  const result: SideBySideDiffSegment[] = [];
  for (const [op, text] of diffs) {
    if (op === 0) {
      result.push({ type: 'equal', leftText: text, rightText: text });
    } else if (op === -1) {
      result.push({ type: 'delete', leftText: text, rightText: '' });
    } else if (op === 1) {
      result.push({ type: 'insert', leftText: '', rightText: text });
    }
  }

  // Optional: merge adjacent insert/delete pairs into 'replace'
  const merged: SideBySideDiffSegment[] = [];
  for (let i = 0; i < result.length; i++) {
    const curr = result[i];
    const next = result[i + 1];
    if (curr && next && curr.type === 'delete' && next.type === 'insert') {
      merged.push({ type: 'replace', leftText: curr.leftText, rightText: next.rightText });
      i++; // skip next
    } else {
      merged.push(curr);
    }
  }
  return merged;
}


