import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface EligibilityResult {
  programName: string;
  status: 'eligible' | 'ineligible' | 'pending';
  benefit?: string;
  nextSteps?: string[];
}

export async function shareEligibilityResult(result: EligibilityResult): Promise<void> {
  const statusEmoji =
    result.status === 'eligible' ? '✅' : result.status === 'ineligible' ? '❌' : '⏳';
  const statusLabel =
    result.status === 'eligible'
      ? 'Eligible'
      : result.status === 'ineligible'
      ? 'Not Eligible'
      : 'Pending Review';

  const lines = [
    `GovPass Eligibility Check`,
    ``,
    `Program: ${result.programName}`,
    `Status: ${statusEmoji} ${statusLabel}`,
  ];

  if (result.benefit) lines.push(`Benefit: ${result.benefit}`);
  if (result.nextSteps?.length) {
    lines.push(``, `Next Steps:`);
    result.nextSteps.forEach((s) => lines.push(`  • ${s}`));
  }
  lines.push(``, `Checked with GovPass — your government benefits navigator`);

  await Haptics.selectionAsync();
  await Share.share({ message: lines.join('\n'), title: `GovPass: ${result.programName}` });
}

export async function shareMultipleResults(results: EligibilityResult[]): Promise<void> {
  const eligible = results.filter((r) => r.status === 'eligible');
  const pending = results.filter((r) => r.status === 'pending');
  const ineligible = results.filter((r) => r.status === 'ineligible');

  const lines: string[] = [`My GovPass Eligibility Summary`, ``];

  if (eligible.length) {
    lines.push(`✅ Eligible (${eligible.length}):`);
    eligible.forEach((r) => lines.push(`  • ${r.programName}${r.benefit ? ` — ${r.benefit}` : ''}`));
    lines.push(``);
  }
  if (pending.length) {
    lines.push(`⏳ Pending Review (${pending.length}):`);
    pending.forEach((r) => lines.push(`  • ${r.programName}`));
    lines.push(``);
  }
  if (ineligible.length) {
    lines.push(`❌ Not Eligible (${ineligible.length}):`);
    ineligible.forEach((r) => lines.push(`  • ${r.programName}`));
    lines.push(``);
  }

  lines.push(`Checked with GovPass — your government benefits navigator`);

  await Haptics.selectionAsync();
  await Share.share({ message: lines.join('\n'), title: 'My GovPass Eligibility Results' });
}
