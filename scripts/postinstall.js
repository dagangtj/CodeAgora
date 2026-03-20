#!/usr/bin/env node

const reset = '\x1b[0m';
const bold = '\x1b[1m';
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const dim = '\x1b[2m';
const yellow = '\x1b[33m';

console.log('');
console.log(`  ${cyan}${bold}CodeAgora${reset} ${dim}v2.0${reset}`);
console.log(`  ${dim}Multi-LLM collaborative code review${reset}`);
console.log('');
console.log(`  ${green}Get started:${reset}`);
console.log(`    ${bold}$ agora init${reset}     ${dim}Auto-detect providers & setup config${reset}`);
console.log(`    ${bold}$ agora review${reset}   ${dim}Run your first code review${reset}`);
console.log('');
console.log(`  ${yellow}Free tier:${reset} ${dim}Groq + GitHub Models = unlimited free reviews${reset}`);
console.log(`  ${dim}Docs: https://github.com/bssm-oss/CodeAgora${reset}`);
console.log('');
